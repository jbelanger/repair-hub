import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const CONTRACT_ADDRESSES = {
  REPAIR_REQUEST: import.meta.env.VITE_REPAIR_REQUEST_CONTRACT,
  WORK_ORDER: import.meta.env.VITE_WORK_ORDER_CONTRACT,
} as const

export enum RepairRequestStatusType {
  PENDING = 0,
  APPROVED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export enum WorkOrderStatusType {
  PENDING = 0,
  ACCEPTED = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export interface RepairRequest {
  id: bigint
  initiator: `0x${string}`
  propertyId: string
  descriptionHash: string
  status: RepairRequestStatusType
  createdAt: bigint
  updatedAt: bigint
}

export interface WorkOrder {
  id: bigint
  repairRequestId: bigint
  landlord: `0x${string}`
  contractor: `0x${string}`
  agreedPrice: bigint
  descriptionHash: string
  status: WorkOrderStatusType
  createdAt: bigint
  updatedAt: bigint
}

// Configure chains & providers with RainbowKit
export const config = getDefaultConfig({
  appName: 'Repair Hub',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http()
  }
})
