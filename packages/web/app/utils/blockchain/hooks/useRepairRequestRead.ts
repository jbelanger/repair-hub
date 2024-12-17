import { useReadContract } from 'wagmi'
import { type Address } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES } from '../config'
import { sepolia } from 'viem/chains'

export function useRepairRequestRead(requestId?: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    functionName: 'getRepairRequest',
    args: requestId ? [requestId] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!requestId,
      refetchInterval: 5000,
      retry: false,
      gcTime: 30000,
      staleTime: 2000
    }
  })
}
