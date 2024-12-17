import { 
  useReadContract,
  useWriteContract,
  useWatchContractEvent
} from 'wagmi'
import { type Address, type HexString } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequest, RepairRequestStatusType } from '../config'
import { decodeEventLog, type TransactionReceipt } from 'viem'

interface BlockchainRepairRequestResult {
  id: bigint;
  hash: HexString;
}

interface ContractWriteResult {
  hash: HexString;
  wait: () => Promise<TransactionReceipt>;
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

export function useRepairRequest() {
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract()

  const createRepairRequest = async (
    propertyId: HexString,
    descriptionHash: HexString,
    landlord: Address
  ): Promise<BlockchainRepairRequestResult> => {
    try {
      const result = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'createRepairRequest',
        args: [propertyId, descriptionHash, landlord],
      }) as unknown as ContractWriteResult

      // Wait for transaction to be mined to get logs
      const receipt = await result.wait()
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

      return { id: args.id, hash: result.hash }
    } catch (error) {
      console.error('Error creating repair request:', error)
      throw error
    }
  }

  const updateStatus = async (
    requestId: bigint,
    status: RepairRequestStatusType
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      functionName: 'updateRepairRequestStatus',
      args: [requestId, BigInt(status)],
    })
  }

  const updateDescription = async (
    requestId: bigint,
    descriptionHash: HexString
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      functionName: 'updateDescription',
      args: [requestId, descriptionHash],
    })
  }

  const updateWorkDetails = async (
    requestId: bigint,
    workDetailsHash: HexString
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      functionName: 'updateWorkDetails',
      args: [requestId, workDetailsHash],
    })
  }

  const withdrawRequest = async (requestId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      functionName: 'withdrawRepairRequest',
      args: [requestId],
    })
  }

  const approveWork = async (requestId: bigint, isAccepted: boolean) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      functionName: 'approveWork',
      args: [requestId, isAccepted],
    })
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

  const result = data as unknown as {
    id: bigint
    initiator: Address
    landlord: Address
    propertyId: HexString
    descriptionHash: HexString
    workDetailsHash: HexString
    status: bigint
    createdAt: bigint
    updatedAt: bigint
  }

  const repairRequest: RepairRequest | undefined = result ? {
    id: result.id,
    initiator: result.initiator,
    landlord: result.landlord,
    propertyId: result.propertyId,
    descriptionHash: result.descriptionHash,
    workDetailsHash: result.workDetailsHash,
    status: Number(result.status) as RepairRequestStatusType,
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
