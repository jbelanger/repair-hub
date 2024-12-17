import { useWatchContractEvent } from 'wagmi'
import { type Address, type HexString } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequestStatusType } from '../config'
import { Result } from 'neverthrow'
import { ContractError, DecodedEventArgs } from '../types/repair-request'
import { decodeEventLog, type Log } from 'viem'

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

export function useRepairRequestEvents(callbacks: RepairRequestEventCallbacks) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestCreated',
    onLogs: (logs) => {
      if (!callbacks.onCreated) return;
      
      const decoder = createEventDecoder('RepairRequestCreated', isCreatedEvent);
      
      for (const log of logs) {
        const result = decoder(log);
        if (result.isOk()) {
          const args = result.value;
          callbacks.onCreated(
            args.id,
            args.initiator,
            args.landlord,
            args.propertyId as HexString,
            args.descriptionHash as HexString,
            args.createdAt
          );
        }
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestStatusChanged',
    onLogs: (logs) => {
      if (!callbacks.onStatusChanged) return;
      
      const decoder = createEventDecoder('RepairRequestStatusChanged', isStatusChangedEvent);
      
      for (const log of logs) {
        const result = decoder(log);
        if (result.isOk()) {
          const args = result.value;
          callbacks.onStatusChanged(
            args.id,
            args.initiator,
            args.landlord,
            Number(args.oldStatus) as RepairRequestStatusType,
            Number(args.newStatus) as RepairRequestStatusType,
            args.updatedAt
          );
        }
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'DescriptionUpdated',
    onLogs: (logs) => {
      if (!callbacks.onDescriptionUpdated) return;
      
      const decoder = createEventDecoder('DescriptionUpdated', isHashUpdateEvent);
      
      for (const log of logs) {
        const result = decoder(log);
        if (result.isOk()) {
          const args = result.value;
          callbacks.onDescriptionUpdated(
            args.id,
            args.initiator,
            args.landlord,
            args.oldHash as HexString,
            args.newHash as HexString,
            args.updatedAt
          );
        }
      }
    }
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'WorkDetailsUpdated',
    onLogs: (logs) => {
      if (!callbacks.onWorkDetailsUpdated) return;
      
      const decoder = createEventDecoder('WorkDetailsUpdated', isHashUpdateEvent);
      
      for (const log of logs) {
        const result = decoder(log);
        if (result.isOk()) {
          const args = result.value;
          callbacks.onWorkDetailsUpdated(
            args.id,
            args.initiator,
            args.landlord,
            args.oldHash as HexString,
            args.newHash as HexString,
            args.updatedAt
          );
        }
      }
    }
  });
}
