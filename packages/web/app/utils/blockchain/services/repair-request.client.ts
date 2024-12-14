import { getPublicClient } from '@wagmi/core'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequestStatusType, config } from '../config'

interface ContractEventLog {
  args: {
    id?: bigint
    initiator?: string
    propertyId?: string
    descriptionHash?: string
    status?: bigint
    createdAt?: bigint
    oldHash?: string
    newHash?: string
    updatedAt?: bigint
  }
  blockNumber: bigint
  blockHash: `0x${string}`
  transactionIndex: number
  removed: boolean
  address: `0x${string}`
  data: `0x${string}`
  topics: `0x${string}`[]
  transactionHash: `0x${string}`
  logIndex: number
}

export class RepairRequestClientService {
  static watchRepairRequestCreated(
    callback: (
      id: bigint,
      initiator: string,
      propertyId: string,
      descriptionHash: string,
      createdAt: bigint
    ) => void
  ): () => void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    const unwatch = client.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      eventName: 'RepairRequestCreated',
      onLogs: (logs: ContractEventLog[]) => {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id && 
              args.initiator && 
              args.propertyId && 
              args.descriptionHash && 
              args.createdAt) {
            callback(
              args.id,
              args.initiator,
              args.propertyId,
              args.descriptionHash,
              args.createdAt
            )
          }
        }
      },
    })

    return unwatch
  }

  static watchRepairRequestUpdated(
    callback: (id: bigint, status: RepairRequestStatusType, updatedAt: bigint) => void
  ): () => void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    const unwatch = client.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      eventName: 'RepairRequestUpdated',
      onLogs: (logs: ContractEventLog[]) => {
        for (const log of logs) {
          const { args } = log
          if (args && args.id && args.status && args.updatedAt) {
            callback(
              args.id,
              Number(args.status) as RepairRequestStatusType,
              args.updatedAt
            )
          }
        }
      },
    })

    return unwatch
  }

  static watchDescriptionHashUpdated(
    callback: (id: bigint, oldHash: string, newHash: string, updatedAt: bigint) => void
  ): () => void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    const unwatch = client.watchContractEvent({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      eventName: 'DescriptionHashUpdated',
      onLogs: (logs: ContractEventLog[]) => {
        for (const log of logs) {
          const { args } = log
          if (args && args.id && args.oldHash && args.newHash && args.updatedAt) {
            callback(
              args.id,
              args.oldHash,
              args.newHash,
              args.updatedAt
            )
          }
        }
      },
    })

    return unwatch
  }
}
