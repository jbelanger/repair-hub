import { getPublicClient } from '@wagmi/core'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequestStatusType, config } from '../config'

interface ContractEventLog {
  args: {
    id?: bigint
    initiator?: string
    landlord?: string
    propertyId?: string
    descriptionHash?: string
    workDetailsHash?: string
    oldStatus?: bigint
    newStatus?: bigint
    oldHash?: string
    newHash?: string
    createdAt?: bigint
    updatedAt?: bigint
  }
  blockNumber: bigint
  blockHash: `0x${string}`
  transactionIndex: number
  removed: boolean
  address: `0x${string}`
  data: `0x${string}`
  topics: readonly `0x${string}`[]
  transactionHash: `0x${string}`
  logIndex: number
}

export class RepairRequestClientService {
  static watchRepairRequestCreated(
    callback: (
      id: bigint,
      initiator: string,
      landlord: string,
      propertyId: string,
      descriptionHash: string,
      createdAt: bigint
    ) => void
  ) {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    return client.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      eventName: 'RepairRequestCreated',
      onLogs(logs) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id && 
              args.initiator && 
              args.landlord &&
              args.propertyId && 
              args.descriptionHash && 
              args.createdAt) {
            callback(
              args.id,
              args.initiator,
              args.landlord,
              args.propertyId,
              args.descriptionHash,
              args.createdAt
            )
          }
        }
      },
    })
  }

  static watchRepairRequestStatusChanged(
    callback: (
      id: bigint,
      initiator: string,
      landlord: string,
      oldStatus: RepairRequestStatusType,
      newStatus: RepairRequestStatusType,
      updatedAt: bigint
    ) => void
  ) {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    return client.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      eventName: 'RepairRequestStatusChanged',
      onLogs(logs) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id && 
              args.initiator &&
              args.landlord &&
              args.oldStatus !== undefined &&
              args.newStatus !== undefined &&
              args.updatedAt) {
            callback(
              args.id,
              args.initiator,
              args.landlord,
              Number(args.oldStatus) as RepairRequestStatusType,
              Number(args.newStatus) as RepairRequestStatusType,
              args.updatedAt
            )
          }
        }
      },
    })
  }

  static watchDescriptionUpdated(
    callback: (
      id: bigint,
      initiator: string,
      landlord: string,
      oldHash: string,
      newHash: string,
      updatedAt: bigint
    ) => void
  ) {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    return client.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      eventName: 'DescriptionUpdated',
      onLogs(logs) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id && 
              args.initiator &&
              args.landlord &&
              args.oldHash && 
              args.newHash && 
              args.updatedAt) {
            callback(
              args.id,
              args.initiator,
              args.landlord,
              args.oldHash,
              args.newHash,
              args.updatedAt
            )
          }
        }
      },
    })
  }

  static watchWorkDetailsUpdated(
    callback: (
      id: bigint,
      initiator: string,
      landlord: string,
      oldHash: string,
      newHash: string,
      updatedAt: bigint
    ) => void
  ) {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    return client.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      eventName: 'WorkDetailsUpdated',
      onLogs(logs) {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id && 
              args.initiator &&
              args.landlord &&
              args.oldHash && 
              args.newHash && 
              args.updatedAt) {
            callback(
              args.id,
              args.initiator,
              args.landlord,
              args.oldHash,
              args.newHash,
              args.updatedAt
            )
          }
        }
      },
    })
  }
}
