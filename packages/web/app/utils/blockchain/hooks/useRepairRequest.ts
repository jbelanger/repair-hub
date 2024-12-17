import { 
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  usePublicClient
} from 'wagmi'
import { type Address, type HexString } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequest, RepairRequestStatusType } from '../config'
import { decodeEventLog, type TransactionReceipt } from 'viem'

interface BlockchainRepairRequestResult {
  id: bigint;
  hash: HexString;
}

interface ContractRepairRequest {
  id: bigint;
  initiator: Address;
  landlord: Address;
  propertyId: string;
  descriptionHash: string;
  workDetailsHash: string;
  status: number;
  createdAt: bigint;
  updatedAt: bigint;
}

type DecodedEventArgs = {
  id: bigint;
  initiator: Address;
  landlord: Address;
} & (
  | {
      propertyId: string;
      descriptionHash: string;
      createdAt: bigint;
    }
  | {
      oldStatus: bigint;
      newStatus: bigint;
      updatedAt: bigint;
    }
  | {
      oldHash: string;
      newHash: string;
      updatedAt: bigint;
    }
);

// Helper function to parse contract errors
function parseContractError(error: any): string {
  console.log('Original error:', error);
  
  // If it's a wagmi error, it might have additional details
  if (error.cause) {
    console.log('Error cause:', error.cause);
  }

  const errorMessage = error.message || error.toString();
  console.log('Error message:', errorMessage);
  
  // Check for specific contract errors
  if (errorMessage.includes('RepairRequestDoesNotExist')) {
    return 'This repair request does not exist';
  }
  if (errorMessage.includes('CallerIsNotLandlord')) {
    return 'Only the landlord can perform this action';
  }
  if (errorMessage.includes('CallerIsNotTenant')) {
    return 'Only the tenant can perform this action';
  }
  if (errorMessage.includes('RequestIsCancelled')) {
    return 'This request has been cancelled and cannot be modified';
  }
  if (errorMessage.includes('RequestIsNotPending')) {
    return 'This action can only be performed on pending requests';
  }
  if (errorMessage.includes('InvalidStatusTransition')) {
    return 'Invalid status transition. Please check the current status and try again.';
  }
  if (errorMessage.includes('RequestNotCompleted')) {
    return 'This action can only be performed on completed requests';
  }
  if (errorMessage.includes('Pausable: paused')) {
    return 'The contract is currently paused. Please try again later.';
  }

  // Check for common web3 errors
  if (errorMessage.includes('user rejected transaction')) {
    return 'Transaction was cancelled';
  }
  if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient funds to complete the transaction';
  }
  if (errorMessage.includes('gas required exceeds allowance')) {
    return 'Transaction would exceed gas limits. Please try again.';
  }
  if (errorMessage.includes('cannot estimate gas') || errorMessage.includes('execution reverted')) {
    return 'Unable to estimate gas. The transaction may fail or the contract could be paused.';
  }

  // Return the original error message if we can't parse it
  return errorMessage;
}

export function useRepairRequest() {
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract()
  const publicClient = usePublicClient()

  const waitForTransaction = async (hash: HexString) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }
    return await publicClient.waitForTransactionReceipt({ hash });
  };

  const createRepairRequest = async (
    propertyId: HexString,
    descriptionHash: HexString,
    landlord: Address
  ): Promise<BlockchainRepairRequestResult> => {
    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      console.log('Creating repair request:', {
        propertyId,
        descriptionHash,
        landlord,
        contractAddress: CONTRACT_ADDRESSES.REPAIR_REQUEST,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'createRepairRequest',
        args: [propertyId, descriptionHash, landlord],
      })

      console.log('Transaction submitted:', hash);

      // Wait for transaction to be mined
      const receipt = await waitForTransaction(hash);
      const event = receipt.logs.find(log => {
        try {
          const decoded = decodeEventLog({
            abi: RepairRequestContractABI,
            data: log.data,
            topics: log.topics
          })
          return decoded.eventName === 'RepairRequestCreated'
        } catch {
          return false
        }
      })

      if (!event) {
        throw new Error('Failed to get request ID from event')
      }

      const decoded = decodeEventLog({
        abi: RepairRequestContractABI,
        data: event.data,
        topics: event.topics
      })

      const args = decoded.args as DecodedEventArgs
      if (!('propertyId' in args)) {
        throw new Error('Invalid event args')
      }

      return { id: args.id, hash }
    } catch (error) {
      console.error('Error in createRepairRequest:', error);
      throw new Error(parseContractError(error))
    }
  }

  const updateStatus = async (
    requestId: bigint,
    status: RepairRequestStatusType
  ) => {
    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      console.log('Updating status:', {
        requestId: requestId.toString(),
        status,
        statusEnum: RepairRequestStatusType[status],
        contractAddress: CONTRACT_ADDRESSES.REPAIR_REQUEST,
      });

      // First check if the request exists and get its current status
      const data = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'getRepairRequest',
        args: [requestId],
      });

      // The contract returns a tuple that matches our ContractRepairRequest interface
      const currentRequest = data as unknown as ContractRepairRequest;
      console.log('Current request state:', {
        ...currentRequest,
        status: RepairRequestStatusType[currentRequest.status],
      });

      // Validate the status transition based on the contract's rules
      const currentStatus = currentRequest.status as RepairRequestStatusType;
      const validTransition = (
        (currentStatus === RepairRequestStatusType.PENDING && 
         (status === RepairRequestStatusType.IN_PROGRESS || status === RepairRequestStatusType.REJECTED)) ||
        (currentStatus === RepairRequestStatusType.IN_PROGRESS && 
         status === RepairRequestStatusType.COMPLETED) ||
        (currentStatus === RepairRequestStatusType.COMPLETED && 
         (status === RepairRequestStatusType.ACCEPTED || status === RepairRequestStatusType.REFUSED))
      );

      if (!validTransition) {
        throw new Error(`Invalid status transition from ${RepairRequestStatusType[currentStatus]} to ${RepairRequestStatusType[status]}`);
      }

      // If validation passes, proceed with the transaction
      console.log('Sending transaction with args:', {
        requestId: requestId.toString(),
        status: status.toString(),
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'updateRepairRequestStatus',
        args: [requestId, BigInt(status)],
      });

      console.log('Transaction submitted:', hash);
      
      // Wait for transaction to be mined
      const receipt = await waitForTransaction(hash);
      return receipt;
    } catch (error) {
      console.error('Error in updateStatus:', error);
      throw new Error(parseContractError(error));
    }
  }

  const updateDescription = async (
    requestId: bigint,
    descriptionHash: HexString
  ) => {
    try {
      console.log('Updating description:', {
        requestId: requestId.toString(),
        descriptionHash,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'updateDescription',
        args: [requestId, descriptionHash],
      });

      console.log('Transaction submitted:', hash);
      
      // Wait for transaction to be mined
      const receipt = await waitForTransaction(hash);
      return receipt;
    } catch (error) {
      console.error('Error in updateDescription:', error);
      throw new Error(parseContractError(error));
    }
  }

  const updateWorkDetails = async (
    requestId: bigint,
    workDetailsHash: HexString
  ) => {
    try {
      console.log('Updating work details:', {
        requestId: requestId.toString(),
        workDetailsHash,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'updateWorkDetails',
        args: [requestId, workDetailsHash],
      });

      console.log('Transaction submitted:', hash);
      
      // Wait for transaction to be mined
      const receipt = await waitForTransaction(hash);
      return receipt;
    } catch (error) {
      console.error('Error in updateWorkDetails:', error);
      throw new Error(parseContractError(error));
    }
  }

  const withdrawRequest = async (requestId: bigint) => {
    try {
      console.log('Withdrawing request:', {
        requestId: requestId.toString(),
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'withdrawRepairRequest',
        args: [requestId],
      });

      console.log('Transaction submitted:', hash);
      
      // Wait for transaction to be mined
      const receipt = await waitForTransaction(hash);
      return receipt;
    } catch (error) {
      console.error('Error in withdrawRequest:', error);
      throw new Error(parseContractError(error));
    }
  }

  const approveWork = async (requestId: bigint, isAccepted: boolean) => {
    try {
      console.log('Approving work:', {
        requestId: requestId.toString(),
        isAccepted,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'approveWork',
        args: [requestId, isAccepted],
      });

      console.log('Transaction submitted:', hash);
      
      // Wait for transaction to be mined
      const receipt = await waitForTransaction(hash);
      return receipt;
    } catch (error) {
      console.error('Error in approveWork:', error);
      throw new Error(parseContractError(error));
    }
  }

  return {
    createRepairRequest,
    updateStatus,
    updateDescription,
    updateWorkDetails,
    withdrawRequest,
    approveWork,
    isPending,
    isSuccess,
    error
  }
}

export function useRepairRequestRead(requestId?: bigint) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    functionName: 'getRepairRequest',
    args: requestId ? [requestId] : undefined,
    query: {
      enabled: !!requestId,
    }
  })

  const result = data as unknown as ContractRepairRequest;

  const repairRequest: RepairRequest | undefined = result ? {
    id: result.id,
    initiator: result.initiator,
    landlord: result.landlord,
    propertyId: result.propertyId,
    descriptionHash: result.descriptionHash,
    workDetailsHash: result.workDetailsHash,
    status: result.status as RepairRequestStatusType,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  } : undefined

  return {
    repairRequest,
    isError,
    isLoading,
    refetch
  }
}

export function useWatchRepairRequestEvents(callbacks: {
  onCreated?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    propertyId: HexString,
    descriptionHash: HexString,
    createdAt: bigint
  ) => void,
  onStatusChanged?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    oldStatus: RepairRequestStatusType,
    newStatus: RepairRequestStatusType,
    updatedAt: bigint
  ) => void,
  onDescriptionUpdated?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    oldHash: HexString,
    newHash: HexString,
    updatedAt: bigint
  ) => void,
  onWorkDetailsUpdated?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    oldHash: HexString,
    newHash: HexString,
    updatedAt: bigint
  ) => void
}) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestCreated',
    onLogs: (logs) => {
      if (callbacks.onCreated) {
        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            })
            const args = decoded.args as DecodedEventArgs
            if (!('propertyId' in args)) continue

            callbacks.onCreated(
              args.id,
              args.initiator,
              args.landlord,
              args.propertyId as HexString,
              args.descriptionHash as HexString,
              args.createdAt
            )
          } catch (error) {
            console.error('Error decoding RepairRequestCreated event:', error)
          }
        }
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestStatusChanged',
    onLogs: (logs) => {
      if (callbacks.onStatusChanged) {
        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            })
            const args = decoded.args as DecodedEventArgs
            if (!('oldStatus' in args)) continue

            callbacks.onStatusChanged(
              args.id,
              args.initiator,
              args.landlord,
              Number(args.oldStatus) as RepairRequestStatusType,
              Number(args.newStatus) as RepairRequestStatusType,
              args.updatedAt
            )
          } catch (error) {
            console.error('Error decoding RepairRequestStatusChanged event:', error)
          }
        }
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'DescriptionUpdated',
    onLogs: (logs) => {
      if (callbacks.onDescriptionUpdated) {
        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            })
            const args = decoded.args as DecodedEventArgs
            if (!('oldHash' in args)) continue

            callbacks.onDescriptionUpdated(
              args.id,
              args.initiator,
              args.landlord,
              args.oldHash as HexString,
              args.newHash as HexString,
              args.updatedAt
            )
          } catch (error) {
            console.error('Error decoding DescriptionUpdated event:', error)
          }
        }
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'WorkDetailsUpdated',
    onLogs: (logs) => {
      if (callbacks.onWorkDetailsUpdated) {
        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            })
            const args = decoded.args as DecodedEventArgs
            if (!('oldHash' in args)) continue

            callbacks.onWorkDetailsUpdated(
              args.id,
              args.initiator,
              args.landlord,
              args.oldHash as HexString,
              args.newHash as HexString,
              args.updatedAt
            )
          } catch (error) {
            console.error('Error decoding WorkDetailsUpdated event:', error)
          }
        }
      }
    }
  })
}

