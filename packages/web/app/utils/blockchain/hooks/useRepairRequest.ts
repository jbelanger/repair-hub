import { 
  useReadContract,
  useWriteContract,
  useWatchContractEvent
} from 'wagmi'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequest, RepairRequestStatusType } from '../config'
import { type Address, type HexString } from '../types'

interface BlockchainRepairRequestResult {
  id: bigint;
  hash: HexString;
}

export function useRepairRequest() {
  const { writeContractAsync, isPending, isSuccess, error } = useWriteContract()

  const createRepairRequest = async (
    propertyId: HexString,
    descriptionHash: HexString,
    landlord: Address
  ): Promise<BlockchainRepairRequestResult> => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
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
              args.initiator as Address,
              args.landlord as Address,
              args.propertyId as HexString,
              args.descriptionHash as HexString,
              args.createdAt
            )
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
              args.initiator as Address,
              args.landlord as Address,
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
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
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
              args.initiator as Address,
              args.landlord as Address,
              args.oldHash as HexString,
              args.newHash as HexString,
              args.updatedAt
            )
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
              args.initiator as Address,
              args.landlord as Address,
              args.oldHash as HexString,
              args.newHash as HexString,
              args.updatedAt
            )
          }
        }
      }
    }
  })
}
