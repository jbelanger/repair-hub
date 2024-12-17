import { useState, useCallback, useEffect } from "react";
import { usePublicClient, useWatchContractEvent } from 'wagmi';
import { CONTRACT_ADDRESSES } from "~/utils/blockchain/config";
import { RepairRequestContractABI } from "~/utils/blockchain/abis/RepairRequestContract";
import { decodeEventLog, type Log } from 'viem';
import type { Address, HexString } from "~/utils/blockchain/types";
import type { BlockchainEvent } from "~/utils/repair-request";
import type { RepairRequestStatusType } from "~/utils/blockchain/config";

export function useRepairRequestEvents(repairRequestId: string) {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const publicClient = usePublicClient();

  // Create a stable callback for event handling
  const handleEvent = useCallback((
    type: BlockchainEvent['type'], 
    timestamp: bigint, 
    data = {}
  ) => {
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

  // Query past events
  useEffect(() => {
    const fetchPastEvents = async () => {
      if (!publicClient) return;

      try {
        // Get past events
        const [createdLogs, statusLogs, workDetailsLogs] = await Promise.all([
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
            event: {
              type: 'event',
              name: 'RepairRequestCreated',
              inputs: [
                { type: 'uint256', name: 'id', indexed: true },
                { type: 'address', name: 'initiator', indexed: true },
                { type: 'address', name: 'landlord', indexed: true },
                { type: 'string', name: 'propertyId' },
                { type: 'string', name: 'descriptionHash' },
                { type: 'uint256', name: 'createdAt' }
              ]
            },
            fromBlock: 'earliest'
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
            event: {
              type: 'event',
              name: 'RepairRequestStatusChanged',
              inputs: [
                { type: 'uint256', name: 'id', indexed: true },
                { type: 'address', name: 'initiator', indexed: true },
                { type: 'address', name: 'landlord', indexed: true },
                { type: 'uint8', name: 'oldStatus' },
                { type: 'uint8', name: 'newStatus' },
                { type: 'uint256', name: 'updatedAt' }
              ]
            },
            fromBlock: 'earliest'
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
            event: {
              type: 'event',
              name: 'WorkDetailsUpdated',
              inputs: [
                { type: 'uint256', name: 'id', indexed: true },
                { type: 'address', name: 'initiator', indexed: true },
                { type: 'address', name: 'landlord', indexed: true },
                { type: 'string', name: 'oldHash' },
                { type: 'string', name: 'newHash' },
                { type: 'uint256', name: 'updatedAt' }
              ]
            },
            fromBlock: 'earliest'
          })
        ]);

        // Process created events
        createdLogs.forEach(log => {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            });
            const args = decoded.args as any;
            if (args.id.toString() === repairRequestId) {
              handleEvent('created', args.createdAt);
            }
          } catch (error) {
            console.error('Error decoding RepairRequestCreated event:', error);
          }
        });

        // Process status change events
        statusLogs.forEach(log => {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            });
            const args = decoded.args as any;
            if (args.id.toString() === repairRequestId) {
              handleEvent('updated', args.updatedAt, { status: args.newStatus });
            }
          } catch (error) {
            console.error('Error decoding RepairRequestStatusChanged event:', error);
          }
        });

        // Process work details events
        workDetailsLogs.forEach(log => {
          try {
            const decoded = decodeEventLog({
              abi: RepairRequestContractABI,
              data: log.data,
              topics: log.topics
            });
            const args = decoded.args as any;
            if (args.id.toString() === repairRequestId) {
              handleEvent('workDetailsUpdated', args.updatedAt, 
                { oldHash: args.oldHash, newHash: args.newHash }
              );
            }
          } catch (error) {
            console.error('Error decoding WorkDetailsUpdated event:', error);
          }
        });
      } catch (error) {
        console.error('Error fetching past events:', error);
      }
    };

    // Clear events and fetch past events when repair request ID changes
    setEvents([]);
    fetchPastEvents();
  }, [repairRequestId, handleEvent, publicClient]);

  // Watch for new events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestCreated',
    onLogs(logs: Log[]) {
      logs.forEach(log => {
        try {
          const decoded = decodeEventLog({
            abi: RepairRequestContractABI,
            data: log.data,
            topics: log.topics
          });
          const args = decoded.args as any;
          if (args.id.toString() === repairRequestId) {
            handleEvent('created', args.createdAt);
          }
        } catch (error) {
          console.error('Error handling RepairRequestCreated event:', error);
        }
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'RepairRequestStatusChanged',
    onLogs(logs: Log[]) {
      logs.forEach(log => {
        try {
          const decoded = decodeEventLog({
            abi: RepairRequestContractABI,
            data: log.data,
            topics: log.topics
          });
          const args = decoded.args as any;
          if (args.id.toString() === repairRequestId) {
            handleEvent('updated', args.updatedAt, { status: args.newStatus });
          }
        } catch (error) {
          console.error('Error handling RepairRequestStatusChanged event:', error);
        }
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
    abi: RepairRequestContractABI,
    eventName: 'WorkDetailsUpdated',
    onLogs(logs: Log[]) {
      logs.forEach(log => {
        try {
          const decoded = decodeEventLog({
            abi: RepairRequestContractABI,
            data: log.data,
            topics: log.topics
          });
          const args = decoded.args as any;
          if (args.id.toString() === repairRequestId) {
            handleEvent('workDetailsUpdated', args.updatedAt, 
              { oldHash: args.oldHash, newHash: args.newHash }
            );
          }
        } catch (error) {
          console.error('Error handling WorkDetailsUpdated event:', error);
        }
      });
    },
  });

  return { events };
}
