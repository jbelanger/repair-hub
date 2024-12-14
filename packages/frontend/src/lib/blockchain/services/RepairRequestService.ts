import { 
  getPublicClient,
  getWalletClient,
  waitForTransaction
} from '@wagmi/core'
import { sepolia } from 'wagmi/chains'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequest, RepairRequestStatusType, config } from '../config'

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

export class RepairRequestService {
  static async getAllRepairRequests(address: string): Promise<RepairRequest[]> {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    try {
      console.log('Fetching repair requests for address:', address)
      console.log('Contract address:', CONTRACT_ADDRESSES.REPAIR_REQUEST)

      const events = await client.getContractEvents({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
        abi: RepairRequestContractABI,
        eventName: 'RepairRequestCreated',
        fromBlock: BigInt(0),
        toBlock: 'latest',
        args: {
          initiator: address as `0x${string}`
        }
      })

      console.log('Found events:', events)

      // Fetch full details for each request
      const requests = await Promise.all(
        events.map(async (event: ContractEventLog) => {
          const { args } = event
          if (!args.id) throw new Error('Invalid event data')
          return this.getRepairRequest(args.id)
        })
      )

      // Sort by creation time, newest first
      return requests.sort((a: RepairRequest, b: RepairRequest) => 
        Number(b.createdAt - a.createdAt)
      )
    } catch (error) {
      console.error('Error in getAllRepairRequests:', error)
      throw new Error(`Failed to fetch repair requests: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async createRepairRequest(
    propertyId: string,
    descriptionHash: string
  ): Promise<`0x${string}`> {
    const client = await getWalletClient(config)
    if (!client) throw new Error('Wallet not connected')

    const hash = await client.writeContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'createRepairRequest',
      args: [propertyId, descriptionHash],
    })

    await waitForTransaction(config, { hash })
    return hash
  }

  static async updateStatus(
    requestId: bigint,
    status: RepairRequestStatusType
  ): Promise<`0x${string}`> {
    const client = await getWalletClient(config)
    if (!client) throw new Error('Wallet not connected')

    const hash = await client.writeContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'updateRepairRequestStatus',
      args: [requestId, status],
    })

    await waitForTransaction(config, { hash })
    return hash
  }

  static async updateDescriptionHash(
    requestId: bigint,
    newDescriptionHash: string
  ): Promise<`0x${string}`> {
    const client = await getWalletClient(config)
    if (!client) throw new Error('Wallet not connected')

    const hash = await client.writeContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'updateDescriptionHash',
      args: [requestId, newDescriptionHash],
    })

    await waitForTransaction(config, { hash })
    return hash
  }

  static async getRepairRequest(requestId: bigint): Promise<RepairRequest> {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    const data = await client.readContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as `0x${string}`,
      abi: RepairRequestContractABI,
      functionName: 'getRepairRequest',
      args: [requestId],
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

    return {
      id: result.id,
      initiator: result.initiator,
      propertyId: result.propertyId,
      descriptionHash: result.descriptionHash,
      status: Number(result.status) as RepairRequestStatusType,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  }

  static watchRepairRequestCreated(
    callback: (
      id: bigint,
      initiator: string,
      propertyId: string,
      descriptionHash: string,
      createdAt: bigint
    ) => void
  ): void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    client.watchContractEvent({
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
  }

  static watchRepairRequestUpdated(
    callback: (id: bigint, status: RepairRequestStatusType, updatedAt: bigint) => void
  ): void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    client.watchContractEvent({
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
  }

  static watchDescriptionHashUpdated(
    callback: (id: bigint, oldHash: string, newHash: string, updatedAt: bigint) => void
  ): void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    client.watchContractEvent({
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
  }
}
