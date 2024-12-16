import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { http } from 'wagmi'

export const CONTRACT_ADDRESSES = {
  REPAIR_REQUEST: import.meta.env.VITE_REPAIR_REQUEST_CONTRACT,
} as const

export enum RepairRequestStatusType {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  ACCEPTED = 3,
  REFUSED = 4,
  REJECTED = 5,
  CANCELLED = 6,
}

export interface RepairRequest {
  id: bigint
  initiator: `0x${string}`
  landlord: `0x${string}`
  propertyId: string
  descriptionHash: string
  workDetailsHash: string
  status: RepairRequestStatusType
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
  },
  ssr: true,
})
