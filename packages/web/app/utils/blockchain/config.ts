import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia, hardhat } from 'wagmi/chains'

// Ensure environment variables are available
const WALLETCONNECT_PROJECT_ID = typeof document !== 'undefined' 
  ? import.meta.env.VITE_WALLETCONNECT_PROJECT_ID 
  : process.env.VITE_WALLETCONNECT_PROJECT_ID;

const REPAIR_REQUEST_CONTRACT = typeof document !== 'undefined'
  ? import.meta.env.VITE_REPAIR_REQUEST_CONTRACT
  : process.env.VITE_REPAIR_REQUEST_CONTRACT;

if (!WALLETCONNECT_PROJECT_ID) {
  console.error('Missing VITE_WALLETCONNECT_PROJECT_ID environment variable');
}

export const CONTRACT_ADDRESSES = {
  REPAIR_REQUEST: REPAIR_REQUEST_CONTRACT,
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

// Configure chains & providers with default transport
export const config = getDefaultConfig({
  appName: 'Repair Hub',
  projectId: WALLETCONNECT_PROJECT_ID as string,
  chains: [hardhat, sepolia], // Added hardhat chain and made it the default
  ssr: true, // Enable SSR mode
})
