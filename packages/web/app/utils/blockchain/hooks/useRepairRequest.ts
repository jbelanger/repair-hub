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
    descriptionHash: string,
    landlord: `0x${string}`
  ): Promise<BlockchainRepairRequestResult> => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
        abi: RepairRequestContractABI,
        functionName: 'createRepairRequest',
        args: [propertyId, descriptionHash, landlord],
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
      args: [requestId, BigInt(status)],
    })
  }

  const updateDescription = async (
    requestId: bigint,
    descriptionHash: string
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'updateDescription',
      args: [requestId, descriptionHash],
    })
  }

  const updateWorkDetails = async (
    requestId: bigint,
    workDetailsHash: string
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'updateWorkDetails',
      args: [requestId, workDetailsHash],
    })
  }

  const withdrawRequest = async (requestId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'withdrawRepairRequest',
      args: [requestId],
    })
  }

  const approveWork = async (requestId: bigint, isAccepted: boolean) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
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
    landlord: `0x${string}`
    propertyId: string
    descriptionHash: string
    workDetailsHash: string
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
    initiator: string,
    landlord: string,
    propertyId: string,
    descriptionHash: string,
    createdAt: bigint
  ) => void,
  onStatusChanged?: (
    id: bigint,
    initiator: string,
    landlord: string,
    oldStatus: RepairRequestStatusType,
    newStatus: RepairRequestStatusType,
    updatedAt: bigint
  ) => void,
  onDescriptionUpdated?: (
    id: bigint,
    initiator: string,
    landlord: string,
    oldHash: string,
    newHash: string,
    updatedAt: bigint
  ) => void,
  onWorkDetailsUpdated?: (
    id: bigint,
    initiator: string,
    landlord: string,
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
              args.landlord !== undefined &&
              args.propertyId !== undefined && 
              args.descriptionHash !== undefined && 
              args.createdAt !== undefined) {
            callbacks.onCreated(
              args.id,
              args.initiator,
              args.landlord,
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
    eventName: 'RepairRequestStatusChanged',
    onLogs: (logs) => {
      if (callbacks.onStatusChanged) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id !== undefined && 
              args.initiator !== undefined &&
              args.landlord !== undefined &&
              args.oldStatus !== undefined &&
              args.newStatus !== undefined &&
              args.updatedAt !== undefined) {
            callbacks.onStatusChanged(
              args.id,
              args.initiator,
              args.landlord,
              Number(args.oldStatus) as RepairRequestStatusType,
              Number(args.newStatus) as RepairRequestStatusType,
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
    eventName: 'DescriptionUpdated',
    onLogs: (logs) => {
      if (callbacks.onDescriptionUpdated) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id !== undefined && 
              args.initiator !== undefined &&
              args.landlord !== undefined &&
              args.oldHash !== undefined && 
              args.newHash !== undefined && 
              args.updatedAt !== undefined) {
            callbacks.onDescriptionUpdated(
              args.id,
              args.initiator,
              args.landlord,
              args.oldHash,
              args.newHash,
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
    eventName: 'WorkDetailsUpdated',
    onLogs: (logs) => {
      if (callbacks.onWorkDetailsUpdated) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id !== undefined && 
              args.initiator !== undefined &&
              args.landlord !== undefined &&
              args.oldHash !== undefined && 
              args.newHash !== undefined && 
              args.updatedAt !== undefined) {
            callbacks.onWorkDetailsUpdated(
              args.id,
              args.initiator,
              args.landlord,
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
