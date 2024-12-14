import { http, createConfig, Config } from 'wagmi'
import { sepolia } from 'wagmi/chains'

// Contract addresses from environment variables
const REPAIR_REQUEST_CONTRACT_ADDRESS = import.meta.env.VITE_REPAIR_REQUEST_CONTRACT
const WORK_ORDER_CONTRACT_ADDRESS = import.meta.env.VITE_WORK_ORDER_CONTRACT

if (!REPAIR_REQUEST_CONTRACT_ADDRESS || !WORK_ORDER_CONTRACT_ADDRESS) {
  throw new Error('Contract addresses not found in environment variables')
}

export const config: Config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
})

export const CONTRACT_ADDRESSES = {
  REPAIR_REQUEST: REPAIR_REQUEST_CONTRACT_ADDRESS,
  WORK_ORDER: WORK_ORDER_CONTRACT_ADDRESS,
} as const

// Status enums matching the smart contracts
export const RepairRequestStatus = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  REJECTED: 3,
} as const

export const RequestUrgencyLevels = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const

export const WorkOrderStatus = {
  DRAFT: 0,
  SIGNED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 4,
} as const

export type RepairRequestStatusType = typeof RepairRequestStatus[keyof typeof RepairRequestStatus]
export type RequestUrgencyType = typeof RequestUrgencyLevels[keyof typeof RequestUrgencyLevels]
export type WorkOrderStatusType = typeof WorkOrderStatus[keyof typeof WorkOrderStatus]

// Contract return types
export interface RepairRequest {
  id: bigint
  initiator: string
  propertyId: string
  descriptionHash: string
  status: RepairRequestStatusType
  createdAt: bigint
  updatedAt: bigint
}

export interface WorkOrder {
  id: bigint
  repairRequestId: bigint
  landlord: string
  contractor: string
  agreedPrice: bigint
  descriptionHash: string
  status: WorkOrderStatusType
  createdAt: bigint
  updatedAt: bigint
}

// Error types
export class BlockchainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BlockchainError'
  }
}

export class WalletError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WalletError'
  }
}

// Helper functions
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask
}

export function getChainName(): string {
  return sepolia.name
}
