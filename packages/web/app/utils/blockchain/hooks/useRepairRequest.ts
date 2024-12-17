import { useWriteContract, usePublicClient, useAccount } from 'wagmi'
import { type Address, type HexString } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequestStatusType } from '../config'
import { ResultAsync } from 'neverthrow'
import { 
  ContractError, 
  BlockchainRepairRequestResult,
  DecodedEventArgs,
  ContractRepairRequest,
  ContractFunctionName,
  ContractFunctionArgs
} from '../types/repair-request'
import { 
  waitForTransaction,
  estimateGas,
  getDefaultTransactionOptions,
  decodeContractEvent
} from '../utils/contract-interactions'
import { parseContractError } from '../utils/contract-errors'
import { decodeEventLog, type TransactionReceipt } from 'viem'
import { readRepairRequest } from '../utils/contract-read'

export function useRepairRequest() {
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract()
  const publicClient = usePublicClient()
  const { isConnected, address } = useAccount()

  // Simple helper to handle common contract write setup
  const prepareContractWrite = async <T extends ContractFunctionName>(
    functionName: T,
    args: ContractFunctionArgs[T],
    skipGasEstimation = false
  ) => {
    if (!isConnected) {
      throw new Error('Please connect your wallet to continue');
    }

    if (!publicClient) {
      throw new Error('Public client not available');
    }

    try {
      await publicClient.getBlockNumber();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('limit') || errorMessage.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      }
      throw error;
    }

    // Always estimate gas
    const gasLimitResult = await estimateGas(publicClient, functionName, args);
    if (gasLimitResult.isErr()) {
      throw new Error('Failed to estimate gas: ' + gasLimitResult.error.message);
    }
    const gasLimit = gasLimitResult.value;

    return { client: publicClient, gasLimit };
  };

  const createRepairRequest = async (
    propertyId: HexString,
    descriptionHash: HexString,
    landlord: Address,
    skipGasEstimation: boolean = false
  ): Promise<ResultAsync<BlockchainRepairRequestResult, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        const args = [propertyId, descriptionHash, landlord] as const;
        const { client, gasLimit } = await prepareContractWrite(
          'createRepairRequest',
          args,
          skipGasEstimation
        );

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'createRepairRequest',
          args,
          ...getDefaultTransactionOptions(gasLimit)
        });

        const receiptResult = await waitForTransaction(client, hash);
        if (receiptResult.isErr()) {
          throw new Error(receiptResult.error.message);
        }
        const receipt = receiptResult.value;

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
        });

        if (!event) {
          throw new Error('Failed to get request ID from event');
        }

        const decodedResult = await decodeContractEvent(
          event,
          'RepairRequestCreated',
          (args): args is DecodedEventArgs & { propertyId: string } => 'propertyId' in args
        );

        if (decodedResult.isErr()) {
          throw new Error(decodedResult.error.message);
        }

        return {
          id: decodedResult.value.id,
          hash: receipt.transactionHash
        };
      })(),
      (error: unknown) => parseContractError(error)
    );
  };

  const updateStatus = async (
    requestId: bigint,
    status: RepairRequestStatusType,
    skipGasEstimation: boolean = false
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        const args = [requestId, BigInt(status)] as const;
        const { client, gasLimit } = await prepareContractWrite(
          'updateRepairRequestStatus',
          args,
          skipGasEstimation
        );

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'updateRepairRequestStatus',
          args,
          ...getDefaultTransactionOptions(gasLimit)
        });

        const receiptResult = await waitForTransaction(client, hash);
        if (receiptResult.isErr()) {
          throw new Error(receiptResult.error.message);
        }
        return receiptResult.value;
      })(),
      (error: unknown) => parseContractError(error)
    );
  };

  const updateWorkDetails = async (
    requestId: bigint,
    workDetailsHash: HexString,
    skipGasEstimation: boolean = false
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        const args = [requestId, workDetailsHash] as const;
        const { client, gasLimit } = await prepareContractWrite(
          'updateWorkDetails',
          args,
          skipGasEstimation
        );

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'updateWorkDetails',
          args,
          ...getDefaultTransactionOptions(gasLimit)
        });

        const receiptResult = await waitForTransaction(client, hash);
        if (receiptResult.isErr()) {
          throw new Error(receiptResult.error.message);
        }
        return receiptResult.value;
      })(),
      (error: unknown) => parseContractError(error)
    );
  };

  const withdrawRequest = async (
    requestId: bigint,
    skipGasEstimation: boolean = false
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        if (!publicClient || !address) {
          throw new Error('Client or wallet not available');
        }

        // Check request state before attempting withdrawal
        const requestResult = await readRepairRequest(publicClient, requestId);
        if (requestResult.isErr()) {
          throw new Error('Failed to read request state: ' + requestResult.error.message);
        }

        const request = requestResult.value;

        // Validate conditions that match contract modifiers
        if (request.initiator.toLowerCase() !== address.toLowerCase()) {
          throw new Error('Only the tenant can withdraw the request');
        }

        if (request.status === RepairRequestStatusType.CANCELLED) {
          throw new Error('Request is already cancelled');
        }

        if (request.status !== RepairRequestStatusType.PENDING) {
          throw new Error('Can only withdraw pending requests');
        }

        const args = [requestId] as const;
        const { client, gasLimit } = await prepareContractWrite(
          'withdrawRepairRequest',
          args,
          skipGasEstimation
        );

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'withdrawRepairRequest',
          args,
          ...getDefaultTransactionOptions(gasLimit)
        });

        const receiptResult = await waitForTransaction(client, hash);
        if (receiptResult.isErr()) {
          throw new Error(receiptResult.error.message);
        }
        return receiptResult.value;
      })(),
      (error: unknown) => parseContractError(error)
    );
  };

  const approveWork = async (
    requestId: bigint,
    isAccepted: boolean,
    skipGasEstimation: boolean = false
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        const args = [requestId, isAccepted] as const;
        const { client, gasLimit } = await prepareContractWrite(
          'approveWork',
          args,
          skipGasEstimation
        );

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'approveWork',
          args,
          ...getDefaultTransactionOptions(gasLimit)
        });

        const receiptResult = await waitForTransaction(client, hash);
        if (receiptResult.isErr()) {
          throw new Error(receiptResult.error.message);
        }
        return receiptResult.value;
      })(),
      (error: unknown) => parseContractError(error)
    );
  };

  return {
    createRepairRequest,
    updateStatus,
    updateWorkDetails,
    withdrawRequest,
    approveWork,
    isPending,
    isSuccess,
    error
  }
}

export { useRepairRequestRead } from './useRepairRequestRead';
