import { useState, useCallback, useEffect } from "react";
import type { Address, HexString } from "~/utils/blockchain/types";
import type { BlockchainEvent } from "~/utils/repair-request";
import type { RepairRequestStatusType } from "~/utils/blockchain/config";

export function useRepairRequestEvents(repairRequestId: string) {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);

  // Create a stable callback for event handling
  const handleEvent = useCallback((type: BlockchainEvent['type'], timestamp: bigint, data = {}) => {
    setEvents(prev => {
      const exists = prev.some(e => 
        e.type === type && 
        e.timestamp === timestamp &&
        JSON.stringify(e.data) === JSON.stringify(data)
      );
      
      if (exists) return prev;
      
      return [...prev, { type, timestamp, data }];
    });
  }, []);

  // Clear events when repair request ID changes
  useEffect(() => {
    setEvents([]);
  }, [repairRequestId]);

  const eventHandlers = {
    onCreated: (id: bigint, initiator: Address, landlord: Address, propertyId: HexString, descriptionHash: HexString, createdAt: bigint) => {
      if (id.toString() === repairRequestId) {
        handleEvent('created', createdAt);
      }
    },
    onStatusChanged: (id: bigint, initiator: Address, landlord: Address, oldStatus: RepairRequestStatusType, newStatus: RepairRequestStatusType, updatedAt: bigint) => {
      if (id.toString() === repairRequestId) {
        handleEvent('updated', updatedAt, { status: newStatus });
      }
    },
    onWorkDetailsUpdated: (id: bigint, initiator: Address, landlord: Address, oldHash: HexString, newHash: HexString, updatedAt: bigint) => {
      if (id.toString() === repairRequestId) {
        handleEvent('workDetailsUpdated', updatedAt, { oldHash, newHash });
      }
    }
  };

  return { events, eventHandlers };
}
