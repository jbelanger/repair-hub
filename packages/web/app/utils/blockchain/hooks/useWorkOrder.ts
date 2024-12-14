import { 
  useReadContract,
  useWriteContract,
  useWatchContractEvent
} from 'wagmi'
import { WorkOrderContractABI } from '../abis/WorkOrderContract'
import { CONTRACT_ADDRESSES, WorkOrder, WorkOrderStatusType } from '../config'

export function useWorkOrder() {
  const { writeContract, isPending, isSuccess, error } = useWriteContract()

  const createWorkOrder = async (
    repairRequestId: bigint,
    landlord: `0x${string}`,
    contractor: `0x${string}`,
    agreedPrice: bigint,
    descriptionHash: string
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'createWorkOrder',
      args: [repairRequestId, landlord, contractor, agreedPrice, descriptionHash],
    })
  }

  const updateStatus = async (orderId: bigint, status: WorkOrderStatusType) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'updateWorkOrderStatus',
      args: [orderId, status],
    })
  }

  const updateDescriptionHash = async (orderId: bigint, newDescriptionHash: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'updateDescriptionHash',
      args: [orderId, newDescriptionHash],
    })
  }

  return {
    createWorkOrder,
    updateStatus,
    updateDescriptionHash,
    isPending,
    isSuccess,
    error
  }
}

export function useWorkOrderRead(orderId?: bigint) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
    abi: WorkOrderContractABI,
    functionName: 'getWorkOrderById',
    args: orderId ? [orderId] : undefined,
    query: {
      enabled: !!orderId,
    }
  })

  const result = data as unknown as {
    id: bigint
    repairRequestId: bigint
    landlord: `0x${string}`
    contractor: `0x${string}`
    agreedPrice: bigint
    descriptionHash: string
    status: bigint
    createdAt: bigint
    updatedAt: bigint
  }

  const workOrder: WorkOrder | undefined = result ? {
    id: result.id,
    repairRequestId: result.repairRequestId,
    landlord: result.landlord,
    contractor: result.contractor,
    agreedPrice: result.agreedPrice,
    descriptionHash: result.descriptionHash,
    status: Number(result.status) as WorkOrderStatusType,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  } : undefined

  return {
    workOrder,
    isError,
    isLoading,
    refetch
  }
}

export function useWorkOrdersByRepairRequest(repairRequestId?: bigint) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
    abi: WorkOrderContractABI,
    functionName: 'getWorkOrdersByRepairRequest',
    args: repairRequestId ? [repairRequestId] : undefined,
    query: {
      enabled: !!repairRequestId,
    }
  })

  return {
    workOrderIds: (data as bigint[]) || [],
    isError,
    isLoading,
    refetch
  }
}

export function useWatchWorkOrderEvents(callbacks: {
  onCreated?: (
    id: bigint,
    repairRequestId: bigint,
    landlord: `0x${string}`,
    contractor: `0x${string}`,
    agreedPrice: bigint,
    descriptionHash: string,
    createdAt: bigint
  ) => void,
  onUpdated?: (
    id: bigint,
    status: WorkOrderStatusType,
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
    address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
    abi: WorkOrderContractABI,
    eventName: 'WorkOrderCreated',
    onLogs: (logs) => {
      if (callbacks.onCreated) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id !== undefined && 
              args.repairRequestId !== undefined && 
              args.landlord !== undefined && 
              args.contractor !== undefined && 
              args.agreedPrice !== undefined && 
              args.descriptionHash !== undefined && 
              args.createdAt !== undefined) {
            callbacks.onCreated(
              args.id,
              args.repairRequestId,
              args.landlord,
              args.contractor,
              args.agreedPrice,
              args.descriptionHash,
              args.createdAt
            )
          }
        }
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
    abi: WorkOrderContractABI,
    eventName: 'WorkOrderUpdated',
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
              Number(args.status) as WorkOrderStatusType,
              args.updatedAt
            )
          }
        }
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
    abi: WorkOrderContractABI,
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
