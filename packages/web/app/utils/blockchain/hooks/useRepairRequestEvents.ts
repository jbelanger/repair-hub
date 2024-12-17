import { type Address, type HexString } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequestStatusType } from '../config'
import { Result } from 'neverthrow'
import { ContractError, DecodedEventArgs } from '../types/repair-request'
import { decodeEventLog, type Log, type PublicClient } from 'viem'

export interface RepairRequestEventCallbacks {
  onCreated?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    propertyId: HexString,
    descriptionHash: HexString,
    createdAt: bigint
  ) => void;
  onStatusChanged?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    oldStatus: RepairRequestStatusType,
    newStatus: RepairRequestStatusType,
    updatedAt: bigint
  ) => void;
  onDescriptionUpdated?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    oldHash: HexString,
    newHash: HexString,
    updatedAt: bigint
  ) => void;
  onWorkDetailsUpdated?: (
    id: bigint,
    initiator: Address,
    landlord: Address,
    oldHash: HexString,
    newHash: HexString,
    updatedAt: bigint
  ) => void;
}

type EventDecoder<T extends DecodedEventArgs> = (log: Log) => Result<T, ContractError>;

const createEventDecoder = <T extends DecodedEventArgs>(
  eventName: string,
  predicate: (args: DecodedEventArgs) => args is T
): EventDecoder<T> => {
  return (log: Log) => {
    return Result.fromThrowable(
      () => {
        const decoded = decodeEventLog({
          abi: RepairRequestContractABI,
          data: log.data,
          topics: log.topics
        });
        
        if (decoded.eventName !== eventName) {
          throw new Error(`Expected ${eventName} event but got ${decoded.eventName}`);
        }
        
        const args = decoded.args as DecodedEventArgs;
        if (!predicate(args)) {
          throw new Error('Invalid event arguments');
        }
        
        return args;
      },
      (): ContractError => ({ code: 'DECODE_ERROR', message: 'Failed to decode event' })
    )();
  };
};

const isCreatedEvent = (args: DecodedEventArgs): args is DecodedEventArgs & {
  propertyId: string;
  descriptionHash: string;
  createdAt: bigint;
} => 'propertyId' in args;

const isStatusChangedEvent = (args: DecodedEventArgs): args is DecodedEventArgs & {
  oldStatus: bigint;
  newStatus: bigint;
  updatedAt: bigint;
} => 'oldStatus' in args && 'newStatus' in args;

const isHashUpdateEvent = (args: DecodedEventArgs): args is DecodedEventArgs & {
  oldHash: string;
  newHash: string;
  updatedAt: bigint;
} => 'oldHash' in args && 'newHash' in args;

// Function to watch a specific event type
export function watchEvent(
  client: PublicClient,
  eventName: 'RepairRequestCreated' | 'RepairRequestStatusChanged' | 'DescriptionUpdated' | 'WorkDetailsUpdated',
  onLogs: (logs: Log[]) => void
) {
  return client.watchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName,
    onLogs
  });
}

// Export event decoders for direct use
export const eventDecoders = {
  created: createEventDecoder('RepairRequestCreated', isCreatedEvent),
  statusChanged: createEventDecoder('RepairRequestStatusChanged', isStatusChangedEvent),
  descriptionUpdated: createEventDecoder('DescriptionUpdated', isHashUpdateEvent),
  workDetailsUpdated: createEventDecoder('WorkDetailsUpdated', isHashUpdateEvent)
};
