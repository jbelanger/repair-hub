import { useWriteContract, usePublicClient } from 'wagmi'
import { type Address, type HexString } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequestStatusType } from '../config'
import { ResultAsync } from 'neverthrow'
import { 
  ContractError, 
  BlockchainRepairRequestResult,
  DecodedEventArgs,
  ContractRepairRequest
} from '../types/repair-request'
import { 
  waitForTransaction,
  estimateGas,
  getDefaultTransactionOptions,
  decodeContractEvent
} from '../utils/contract-interactions'
import { parseContractError } from '../utils/contract-errors'
import { decodeEventLog, type TransactionReceipt } from 'viem'

export function useRepairRequest() {
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract()
  const publicClient = usePublicClient()

  const createRepairRequest = async (
    propertyId: HexString,
    descriptionHash: HexString,
    landlord: Address
  ): Promise<ResultAsync<BlockchainRepairRequestResult, ContractError>> => {
    if (!publicClient) {
      return ResultAsync.fromPromise(
        Promise.reject(new Error('Public client not available')),
        () => ({ code: 'NO_CLIENT', message: 'Public client not available' })
      );
    }

    const gasLimitResult = await estimateGas(publicClient, 'createRepairRequest', [propertyId, descriptionHash, landlord]);
    const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

    return ResultAsync.fromPromise(
      writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'createRepairRequest',
        args: [propertyId, descriptionHash, landlord],
        ...getDefaultTransactionOptions(gasLimit)
      }),
      (error: unknown) => parseContractError(error)
    )
    .andThen(hash => waitForTransaction(publicClient, hash))
    .andThen(receipt => {
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
        return ResultAsync.fromPromise(
          Promise.reject(new Error('No event found')),
          () => ({ code: 'NO_EVENT', message: 'Failed to get request ID from event' })
        );
      }

      return decodeContractEvent(
        event,
        'RepairRequestCreated',
        (args): args is DecodedEventArgs & { propertyId: string } => 'propertyId' in args
      ).map(args => ({
        id: args.id,
        hash: receipt.transactionHash
      }));
    });
  };

  const updateStatus = async (
    requestId: bigint,
    status: RepairRequestStatusType
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    if (!publicClient?.account) {
      return ResultAsync.fromPromise(
        Promise.reject(new Error('No account connected')),
        () => ({ code: 'NO_ACCOUNT', message: 'No account connected' })
      );
    }

    const requestResult = await ResultAsync.fromPromise<ContractRepairRequest, ContractError>(
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'getRepairRequest',
        args: [requestId],
      }) as Promise<ContractRepairRequest>,
      () => ({ code: 'NOT_FOUND', message: 'Failed to fetch repair request' })
    );

    if (requestResult.isErr()) {
      return ResultAsync.fromPromise(
        Promise.reject(requestResult.error),
        () => requestResult.error
      );
    }

    const gasLimitResult = await estimateGas(publicClient, 'updateRepairRequestStatus', [requestId, BigInt(status)]);
    const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

    return ResultAsync.fromPromise(
      writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'updateRepairRequestStatus',
        args: [requestId, BigInt(status)],
        ...getDefaultTransactionOptions(gasLimit)
      }),
      (error: unknown) => parseContractError(error)
    )
    .andThen(hash => waitForTransaction(publicClient, hash));
  };

  const updateWorkDetails = async (
    requestId: bigint,
    workDetailsHash: HexString
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    if (!publicClient) {
      return ResultAsync.fromPromise(
        Promise.reject(new Error('Public client not available')),
        () => ({ code: 'NO_CLIENT', message: 'Public client not available' })
      );
    }

    const gasLimitResult = await estimateGas(publicClient, 'updateWorkDetails', [requestId, workDetailsHash]);
    const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

    return ResultAsync.fromPromise(
      writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'updateWorkDetails',
        args: [requestId, workDetailsHash],
        ...getDefaultTransactionOptions(gasLimit)
      }),
      (error: unknown) => parseContractError(error)
    )
    .andThen(hash => waitForTransaction(publicClient, hash));
  };

  const withdrawRequest = async (
    requestId: bigint
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    if (!publicClient?.account) {
      return ResultAsync.fromPromise(
        Promise.reject(new Error('No account connected')),
        () => ({ code: 'NO_ACCOUNT', message: 'No account connected' })
      );
    }

    const gasLimitResult = await estimateGas(publicClient, 'withdrawRepairRequest', [requestId]);
    const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

    return ResultAsync.fromPromise(
      writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'withdrawRepairRequest',
        args: [requestId],
        ...getDefaultTransactionOptions(gasLimit)
      }),
      (error: unknown) => parseContractError(error)
    )
    .andThen(hash => waitForTransaction(publicClient, hash));
  };

  const approveWork = async (
    requestId: bigint,
    isAccepted: boolean
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    if (!publicClient?.account) {
      return ResultAsync.fromPromise(
        Promise.reject(new Error('No account connected')),
        () => ({ code: 'NO_ACCOUNT', message: 'No account connected' })
      );
    }

    const gasLimitResult = await estimateGas(publicClient, 'approveWork', [requestId, isAccepted]);
    const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

    return ResultAsync.fromPromise(
      writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        functionName: 'approveWork',
        args: [requestId, isAccepted],
        ...getDefaultTransactionOptions(gasLimit)
      }),
      (error: unknown) => parseContractError(error)
    )
    .andThen(hash => waitForTransaction(publicClient, hash));
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
export { useRepairRequestEvents } from './useRepairRequestEvents';
