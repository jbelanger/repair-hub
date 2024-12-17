import { type Address } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES } from '../config'
import { type PublicClient, type Log } from 'viem'
import { ResultAsync } from 'neverthrow'
import { ContractError } from '../types/repair-request'

export function watchRepairRequestEvents(
  client: PublicClient,
  onLogs: (logs: Log[]) => void
): ResultAsync<{ unwatch: () => void }, ContractError> {
  if (!client) {
    return ResultAsync.fromPromise(
      Promise.reject(new Error('Client not available')),
      () => ({ code: 'NO_CLIENT', message: 'Client not available' })
    );
  }

  try {
    const unwatchers = [
      client.watchContractEvent({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        eventName: 'RepairRequestCreated',
        onLogs
      }),
      client.watchContractEvent({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        eventName: 'RepairRequestStatusChanged',
        onLogs
      }),
      client.watchContractEvent({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        eventName: 'DescriptionUpdated',
        onLogs
      }),
      client.watchContractEvent({
        address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
        abi: RepairRequestContractABI,
        eventName: 'WorkDetailsUpdated',
        onLogs
      })
    ];

    return ResultAsync.fromPromise(
      Promise.resolve({
        unwatch: () => {
          unwatchers.forEach(unwatch => unwatch());
        }
      }),
      () => ({ code: 'WATCH_ERROR', message: 'Failed to watch events' })
    );
  } catch (error) {
    return ResultAsync.fromPromise(
      Promise.reject(error),
      () => ({ code: 'WATCH_ERROR', message: 'Failed to setup event watchers' })
    );
  }
}
