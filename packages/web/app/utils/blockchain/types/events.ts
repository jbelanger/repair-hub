import { type Log } from 'viem'
import { type RepairRequestStatusType } from '../config'

export type BlockchainEventType = 'created' | 'updated' | 'hashUpdated' | 'workDetailsUpdated'

export interface BlockchainEventData {
  status?: RepairRequestStatusType
  oldHash?: `0x${string}`
  newHash?: `0x${string}`
}

export interface BlockchainEvent extends Omit<Log, 'data'> {
  type: BlockchainEventType
  timestamp: bigint
  data: BlockchainEventData
}

// Map contract event names to our event types
export const eventTypeMap: Record<string, BlockchainEventType> = {
  'RepairRequestCreated': 'created',
  'RepairRequestStatusChanged': 'updated',
  'DescriptionUpdated': 'hashUpdated',
  'WorkDetailsUpdated': 'workDetailsUpdated'
} as const
