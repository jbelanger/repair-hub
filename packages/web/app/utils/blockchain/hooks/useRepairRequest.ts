import { useWriteContract, usePublicClient, useAccount } from 'wagmi'
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
  const { isConnected } = useAccount()

  const checkRateLimitAndClient = async () => {
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
    return publicClient;
  };

  const createRepairRequest = async (
    propertyId: HexString,
    descriptionHash: HexString,
    landlord: Address
  ): Promise<ResultAsync<BlockchainRepairRequestResult, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        if (!isConnected) {
          throw new Error('Please connect your wallet to continue');
        }

        const client = await checkRateLimitAndClient();
        const gasLimitResult = await estimateGas(client, 'createRepairRequest', [propertyId, descriptionHash, landlord]);
        const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'createRepairRequest',
          args: [propertyId, descriptionHash, landlord],
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
    status: RepairRequestStatusType
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        if (!isConnected) {
          throw new Error('Please connect your wallet to continue');
        }

        const client = await checkRateLimitAndClient();
        const gasLimitResult = await estimateGas(client, 'updateRepairRequestStatus', [requestId, BigInt(status)]);
        const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'updateRepairRequestStatus',
          args: [requestId, BigInt(status)],
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
    workDetailsHash: HexString
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        if (!isConnected) {
          throw new Error('Please connect your wallet to continue');
        }

        const client = await checkRateLimitAndClient();
        const gasLimitResult = await estimateGas(client, 'updateWorkDetails', [requestId, workDetailsHash]);
        const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'updateWorkDetails',
          args: [requestId, workDetailsHash],
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
    requestId: bigint
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        if (!isConnected) {
          throw new Error('Please connect your wallet to continue');
        }

        const client = await checkRateLimitAndClient();
        const gasLimitResult = await estimateGas(client, 'withdrawRepairRequest', [requestId]);
        const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'withdrawRepairRequest',
          args: [requestId],
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
    isAccepted: boolean
  ): Promise<ResultAsync<TransactionReceipt, ContractError>> => {
    return ResultAsync.fromPromise(
      (async () => {
        if (!isConnected) {
          throw new Error('Please connect your wallet to continue');
        }

        const client = await checkRateLimitAndClient();
        const gasLimitResult = await estimateGas(client, 'approveWork', [requestId, isAccepted]);
        const gasLimit = gasLimitResult.isOk() ? gasLimitResult.value : 500000n;

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
          abi: RepairRequestContractABI,
          functionName: 'approveWork',
          args: [requestId, isAccepted],
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
