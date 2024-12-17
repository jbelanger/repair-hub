import { type TransactionReceipt, type Log, decodeEventLog } from 'viem'
import { type Address, type HexString } from '../types'
import { ResultAsync } from 'neverthrow'
import { ContractError, DecodedEventArgs, ContractFunctionName, ContractFunctionArgs } from '../types/repair-request'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES } from '../config'
import type { EstimateContractGasParameters } from 'viem'
import { usePublicClient } from 'wagmi'

type PublicClient = NonNullable<ReturnType<typeof usePublicClient>>

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message.toLowerCase();
      
      // Only retry on rate limit errors
      if (!errorMessage.includes('limit') && !errorMessage.includes('429')) {
        throw error;
      }

      retries++;
      if (retries === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s, etc.
      const backoffDelay = initialDelay * Math.pow(2, retries - 1);
      await delay(backoffDelay);
    }
  }

  throw lastError;
}

export const waitForTransaction = (
  publicClient: PublicClient | null,
  hash: HexString
): ResultAsync<TransactionReceipt, ContractError> => {
  if (!publicClient) {
    return ResultAsync.fromPromise(
      Promise.reject(new Error('Public client not available')),
      () => ({ code: 'NO_CLIENT', message: 'Public client not available' })
    );
  }
  
  return ResultAsync.fromPromise(
    retryWithBackoff(() => publicClient.waitForTransactionReceipt({ hash })),
    (error) => {
      if (error instanceof Error && error.message.toLowerCase().includes('limit')) {
        return { code: 'RATE_LIMIT', message: 'Rate limit exceeded. Please try again in a few minutes.' };
      }
      return { code: 'TRANSACTION_FAILED', message: 'Failed to process transaction' };
    }
  );
};

export const estimateGas = <T extends ContractFunctionName>(
  publicClient: PublicClient | null,
  functionName: T,
  args: ContractFunctionArgs[T]
): ResultAsync<bigint, ContractError> => {
  if (!publicClient) {
    return ResultAsync.fromPromise(
      Promise.resolve(500000n),
      () => ({ code: 'NO_CLIENT', message: 'Public client not available' })
    );
  }

  const params: EstimateContractGasParameters = {
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    functionName: functionName,
    args: args
  };

  return ResultAsync.fromPromise(
    retryWithBackoff(() => publicClient.estimateContractGas(params)),
    (error) => {
      if (error instanceof Error && error.message.toLowerCase().includes('limit')) {
        return { code: 'RATE_LIMIT', message: 'Rate limit exceeded. Please try again in a few minutes.' };
      }
      return { code: 'GAS_ESTIMATION', message: 'Failed to estimate gas' };
    }
  ).map((gasEstimate: unknown) => {
    const estimate = gasEstimate as bigint;
    return (estimate * 400n) / 100n; // Add 200% buffer
  });
};

export const decodeContractEvent = <T extends DecodedEventArgs>(
  log: Log,
  eventName: string,
  predicate: (args: DecodedEventArgs) => args is T
): ResultAsync<T, ContractError> => {
  return ResultAsync.fromPromise(
    Promise.resolve().then(() => {
      const decoded = decodeEventLog({
        abi: RepairRequestContractABI,
        data: log.data,
        topics: log.topics
      });
      const args = decoded.args as DecodedEventArgs;
      
      if (decoded.eventName !== eventName || !predicate(args)) {
        throw new Error('Invalid event data');
      }
      
      return args;
    }),
    () => ({ code: 'DECODE_ERROR', message: 'Failed to decode event' })
  );
};

export const getDefaultTransactionOptions = (gasLimit: bigint) => ({
  gas: gasLimit,
  // Remove hardcoded gas values to let the wallet estimate them dynamically
});
