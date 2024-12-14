import { 
  useReadContract,
  useWriteContract,
  useWatchContractEvent
} from 'wagmi'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequest, RepairRequestStatusType } from '../config'

interface BlockchainRepairRequestResult {
  id: bigint;
  hash: `0x${string}`;
}

export function useRepairRequest() {
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract()

  const createRepairRequest = async (
    propertyId: string,
    descriptionHash: string
  ): Promise<BlockchainRepairRequestResult> => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
        abi: RepairRequestContractABI,
        functionName: 'createRepairRequest',
        args: [propertyId, descriptionHash],
      })

      // In a real implementation, you would get the ID from the transaction receipt
      // For now, we'll use a timestamp as a placeholder
      const id = BigInt(Date.now())

      return {
        id,
        hash,
      }
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
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'updateRepairRequestStatus',
      args: [requestId, status],
    })
  }

  const updateDescriptionHash = async (
    requestId: bigint,
    newDescriptionHash: string
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'updateDescriptionHash',
      args: [requestId, newDescriptionHash],
    })
  }

  return {
    createRepairRequest,
    updateStatus,
    updateDescriptionHash,
    isPending,
    isSuccess,
    error
  }
}

export function useRepairRequestRead(requestId?: bigint) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
    abi: RepairRequestContractABI,
    functionName: 'getRepairRequest',
    args: requestId ? [requestId] : undefined,
    query: {
      enabled: !!requestId,
    }
  })

  const result = data as unknown as {
    id: bigint
    initiator: `0x${string}`
    propertyId: string
    descriptionHash: string
    status: bigint
    createdAt: bigint
    updatedAt: bigint
  }

  const repairRequest: RepairRequest | undefined = result ? {
    id: result.id,
    initiator: result.initiator,
    propertyId: result.propertyId,
    descriptionHash: result.descriptionHash,
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
    initiator: string,
    propertyId: string,
    descriptionHash: string,
    createdAt: bigint
  ) => void,
  onUpdated?: (
    id: bigint,
    status: RepairRequestStatusType,
    updatedAt: bigint
  ) => void,
  onDescriptionHashUpdated?: (
    id: bigint,
    oldHash: string,
    newHash: string,
    updatedAt: bigint
  ) => void
}) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestCreated',
    onLogs: (logs) => {
      if (callbacks.onCreated) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id !== undefined && 
              args.initiator !== undefined && 
              args.propertyId !== undefined && 
              args.descriptionHash !== undefined && 
              args.createdAt !== undefined) {
            callbacks.onCreated(
              args.id,
              args.initiator,
              args.propertyId,
              args.descriptionHash,
              args.createdAt
            )
          }
        }
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestUpdated',
    onLogs: (logs) => {
      if (callbacks.onUpdated) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id !== undefined && 
              args.status !== undefined && 
              args.updatedAt !== undefined) {
            callbacks.onUpdated(
              args.id,
              Number(args.status) as RepairRequestStatusType,
              args.updatedAt
            )
          }
        }
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
    abi: RepairRequestContractABI,
    eventName: 'DescriptionHashUpdated',
    onLogs: (logs) => {
      if (callbacks.onDescriptionHashUpdated) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id !== undefined && 
              args.oldHash !== undefined && 
              args.newHash !== undefined && 
              args.updatedAt !== undefined) {
            callbacks.onDescriptionHashUpdated(
              args.id,
              args.oldHash,
              args.newHash,
              args.updatedAt
            )
          }
        }
      }
    }
  })
}
