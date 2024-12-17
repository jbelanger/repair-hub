import { useReadContract } from 'wagmi'
import { type Address } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES } from '../config'
import { sepolia } from 'viem/chains'
import { ResultAsync } from 'neverthrow'
import { ContractError, ContractRepairRequest } from '../types/repair-request'

export function useRepairRequestRead(requestId?: bigint) {
  const result = useReadContract({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    functionName: 'getRepairRequest',
    args: requestId ? [requestId] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!requestId,
      retry: true, // Enable retries
      retryDelay: 1000, // Wait 1 second between retries
      // Enable automatic refetching
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
      // Keep data fresh
      staleTime: 30000, // Consider data stale after 30 seconds
      // Cache for 5 minutes
      gcTime: 300000
    }
  })

  const getResult = (): ResultAsync<ContractRepairRequest, ContractError> => {
    if (result.error) {
      return ResultAsync.fromPromise(
        Promise.reject(result.error),
        () => ({ code: 'READ_ERROR', message: 'Failed to read repair request' })
      )
    }
    if (!result.data) {
      return ResultAsync.fromPromise(
        Promise.reject(new Error('No data')),
        () => ({ code: 'NOT_FOUND', message: 'No repair request data found' })
      )
    }
    return ResultAsync.fromPromise(
      Promise.resolve(result.data as ContractRepairRequest),
      () => ({ code: 'DECODE_ERROR', message: 'Failed to decode repair request data' })
    )
  }

  return {
    ...result,
    getResult
  }
}
