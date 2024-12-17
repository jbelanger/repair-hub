import { type Address, type HexString } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES, RepairRequestStatusType } from '../config'
import { ResultAsync, errAsync, okAsync } from 'neverthrow'
import { ContractError, ContractRepairRequest, DecodedEventArgs } from '../types/repair-request'
import { 
  decodeEventLog, 
  type Log, 
  type TransactionReceipt,
  type PublicClient,
  type WalletClient,
  type Chain,
  type WriteContractParameters,
  type Account,
  type ReadContractParameters
} from 'viem'
import { parseContractError } from '../utils/contract-errors'
import { waitForTransaction, estimateGas, getDefaultTransactionOptions } from '../utils/contract-interactions'
import { sepolia } from 'viem/chains'

type ContractParams = {
  address: Address;
  abi: typeof RepairRequestContractABI;
  chain: Chain;
};

export class RepairRequestService {
  private chain: Chain = sepolia;
  private baseParams: ContractParams;

  constructor(
    private publicClient: PublicClient | null,
    private walletClient: WalletClient | null
  ) {
    this.baseParams = {
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      chain: this.chain
    };
  }

  private ensurePublicClient(): ResultAsync<PublicClient, ContractError> {
    return this.publicClient 
      ? okAsync(this.publicClient)
      : errAsync({ code: 'NO_CLIENT', message: 'Public client not available' });
  }

  private ensureWalletClient(): ResultAsync<WalletClient, ContractError> {
    return this.walletClient 
      ? okAsync(this.walletClient)
      : errAsync({ code: 'NO_ACCOUNT', message: 'Wallet not connected' });
  }

  getRepairRequest(requestId: bigint): ResultAsync<ContractRepairRequest, ContractError> {
    return this.ensurePublicClient()
      .andThen(client => 
        ResultAsync.fromPromise(
          client.readContract({
            ...this.baseParams,
            functionName: 'getRepairRequest',
            args: [requestId],
          } as ReadContractParameters) as Promise<ContractRepairRequest>,
          (error: unknown) => {
            console.error('Error reading repair request:', error);
            return { code: 'READ_ERROR', message: 'Failed to read repair request' };
          }
        )
      );
  }

  withdrawRequest(requestId: bigint): ResultAsync<TransactionReceipt, ContractError> {
    return this.ensureWalletClient()
      .andThen(client => 
        estimateGas(this.publicClient, 'withdrawRepairRequest', [requestId])
          .orElse(() => okAsync(500000n))
          .andThen(gasLimit => 
            ResultAsync.fromPromise(
              client.writeContract({
                ...this.baseParams,
                functionName: 'withdrawRepairRequest',
                args: [requestId],
                account: client.account as Account,
                ...getDefaultTransactionOptions(gasLimit)
              } as WriteContractParameters),
              parseContractError
            )
          )
          .andThen(hash => 
            this.ensurePublicClient()
              .andThen(client => waitForTransaction(client, hash))
          )
      );
  }

  updateWorkDetails(requestId: bigint, workDetailsHash: HexString): ResultAsync<TransactionReceipt, ContractError> {
    return this.ensureWalletClient()
      .andThen(client => 
        estimateGas(this.publicClient, 'updateWorkDetails', [requestId, workDetailsHash])
          .orElse(() => okAsync(500000n))
          .andThen(gasLimit => 
            ResultAsync.fromPromise(
              client.writeContract({
                ...this.baseParams,
                functionName: 'updateWorkDetails',
                args: [requestId, workDetailsHash],
                account: client.account as Account,
                ...getDefaultTransactionOptions(gasLimit)
              } as WriteContractParameters),
              parseContractError
            )
          )
          .andThen(hash => 
            this.ensurePublicClient()
              .andThen(client => waitForTransaction(client, hash))
          )
      );
  }

  updateStatus(requestId: bigint, status: RepairRequestStatusType): ResultAsync<TransactionReceipt, ContractError> {
    return this.ensureWalletClient()
      .andThen(client => 
        estimateGas(this.publicClient, 'updateRepairRequestStatus', [requestId, BigInt(status)])
          .orElse(() => okAsync(500000n))
          .andThen(gasLimit => 
            ResultAsync.fromPromise(
              client.writeContract({
                ...this.baseParams,
                functionName: 'updateRepairRequestStatus',
                args: [requestId, BigInt(status)],
                account: client.account as Account,
                ...getDefaultTransactionOptions(gasLimit)
              } as WriteContractParameters),
              parseContractError
            )
          )
          .andThen(hash => 
            this.ensurePublicClient()
              .andThen(client => waitForTransaction(client, hash))
          )
      );
  }

  approveWork(requestId: bigint, isAccepted: boolean): ResultAsync<TransactionReceipt, ContractError> {
    return this.ensureWalletClient()
      .andThen(client => 
        estimateGas(this.publicClient, 'approveWork', [requestId, isAccepted])
          .orElse(() => okAsync(500000n))
          .andThen(gasLimit => 
            ResultAsync.fromPromise(
              client.writeContract({
                ...this.baseParams,
                functionName: 'approveWork',
                args: [requestId, isAccepted],
                account: client.account as Account,
                ...getDefaultTransactionOptions(gasLimit)
              } as WriteContractParameters),
              parseContractError
            )
          )
          .andThen(hash => 
            this.ensurePublicClient()
              .andThen(client => waitForTransaction(client, hash))
          )
      );
  }

  watchEvents(onLogs: (logs: Log[]) => void): ResultAsync<{ unwatch: () => void }, ContractError> {
    return this.ensurePublicClient()
      .map(client => {
        const unwatchers = [
          client.watchContractEvent({
            ...this.baseParams,
            eventName: 'RepairRequestCreated',
            onLogs
          }),
          client.watchContractEvent({
            ...this.baseParams,
            eventName: 'RepairRequestStatusChanged',
            onLogs
          }),
          client.watchContractEvent({
            ...this.baseParams,
            eventName: 'DescriptionUpdated',
            onLogs
          }),
          client.watchContractEvent({
            ...this.baseParams,
            eventName: 'WorkDetailsUpdated',
            onLogs
          })
        ];

        return {
          unwatch: () => {
            unwatchers.forEach(unwatch => unwatch());
          }
        };
      });
  }
}
