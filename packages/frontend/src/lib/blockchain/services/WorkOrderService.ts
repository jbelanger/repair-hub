import { 
  getPublicClient,
  getWalletClient,
  waitForTransaction
} from '@wagmi/core'
import { sepolia } from 'wagmi/chains'
import { WorkOrderContractABI } from '../abis/WorkOrderContract'
import { CONTRACT_ADDRESSES, WorkOrder, WorkOrderStatusType, config } from '../config'

type ContractEventLog = {
  args: {
    id?: bigint
    repairRequestId?: bigint
    landlord?: `0x${string}`
    contractor?: `0x${string}`
    agreedPrice?: bigint
    descriptionHash?: string
    createdAt?: bigint
    oldHash?: string
    newHash?: string
    status?: bigint
    updatedAt?: bigint
  }
}

export class WorkOrderService {
  static async createWorkOrder(
    repairRequestId: bigint,
    landlord: `0x${string}`,
    contractor: `0x${string}`,
    agreedPrice: bigint,
    descriptionHash: string
  ): Promise<`0x${string}`> {
    const client = await getWalletClient(config)
    if (!client) throw new Error('Wallet not connected')

    const hash = await client.writeContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'createWorkOrder',
      args: [repairRequestId, landlord, contractor, agreedPrice, descriptionHash],
    })

    await waitForTransaction(config, { hash })
    return hash
  }

  static async updateStatus(
    orderId: bigint,
    status: WorkOrderStatusType
  ): Promise<`0x${string}`> {
    const client = await getWalletClient(config)
    if (!client) throw new Error('Wallet not connected')

    const hash = await client.writeContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'updateWorkOrderStatus',
      args: [orderId, status],
    })

    await waitForTransaction(config, { hash })
    return hash
  }

  static async updateDescriptionHash(
    orderId: bigint,
    newDescriptionHash: string
  ): Promise<`0x${string}`> {
    const client = await getWalletClient(config)
    if (!client) throw new Error('Wallet not connected')

    const hash = await client.writeContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'updateDescriptionHash',
      args: [orderId, newDescriptionHash],
    })

    await waitForTransaction(config, { hash })
    return hash
  }

  static async getWorkOrder(orderId: bigint): Promise<WorkOrder> {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    const data = await client.readContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'getWorkOrderById',
      args: [orderId],
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

    return {
      id: result.id,
      repairRequestId: result.repairRequestId,
      landlord: result.landlord,
      contractor: result.contractor,
      agreedPrice: result.agreedPrice,
      descriptionHash: result.descriptionHash,
      status: Number(result.status) as WorkOrderStatusType,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }
  }

  static async getWorkOrdersByRepairRequest(repairRequestId: bigint): Promise<bigint[]> {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    const data = await client.readContract({
      chain: sepolia,
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      functionName: 'getWorkOrdersByRepairRequest',
      args: [repairRequestId],
    })

    return data as bigint[]
  }

  static watchWorkOrderCreated(
    callback: (
      id: bigint,
      repairRequestId: bigint,
      landlord: `0x${string}`,
      contractor: `0x${string}`,
      agreedPrice: bigint,
      descriptionHash: string,
      createdAt: bigint
    ) => void
  ): void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    client.watchContractEvent({
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      eventName: 'WorkOrderCreated',
      onLogs: (logs: ContractEventLog[]) => {
        for (const log of logs) {
          const { args } = log
          if (args && 
              args.id && 
              args.repairRequestId && 
              args.landlord && 
              args.contractor && 
              args.agreedPrice && 
              args.descriptionHash && 
              args.createdAt) {
            callback(
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
      },
    })
  }

  static watchWorkOrderUpdated(
    callback: (id: bigint, status: WorkOrderStatusType, updatedAt: bigint) => void
  ): void {
    const client = getPublicClient(config)
    if (!client) throw new Error('Failed to get public client')

    client.watchContractEvent({
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
      eventName: 'WorkOrderUpdated',
      onLogs: (logs: ContractEventLog[]) => {
        for (const log of logs) {
          const { args } = log
          if (args && args.id && args.status && args.updatedAt) {
            callback(
              args.id,
              Number(args.status) as WorkOrderStatusType,
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
      address: CONTRACT_ADDRESSES.WORK_ORDER as `0x${string}`,
      abi: WorkOrderContractABI,
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
