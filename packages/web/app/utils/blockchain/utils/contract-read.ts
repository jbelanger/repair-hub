import { type Address } from '../types'
import { RepairRequestContractABI } from '../abis/RepairRequestContract'
import { CONTRACT_ADDRESSES } from '../config'
import { type PublicClient, type ReadContractParameters } from 'viem'
import { ResultAsync } from 'neverthrow'
import { ContractError, ContractRepairRequest } from '../types/repair-request'

type RepairRequestReadParams = ReadContractParameters<
  typeof RepairRequestContractABI,
  'getRepairRequest',
  [requestId: bigint]
>

export function readRepairRequest(
  client: PublicClient,
  requestId: bigint
): ResultAsync<ContractRepairRequest, ContractError> {
  return ResultAsync.fromPromise(
    client.readContract({
      address: CONTRACT_ADDRESSES.REPAIR_REQUEST as Address,
      abi: RepairRequestContractABI,
      functionName: 'getRepairRequest',
      args: [requestId]
    } as RepairRequestReadParams),
    (error: unknown) => ({
      code: 'READ_ERROR',
      message: error instanceof Error ? error.message : 'Failed to read repair request'
    })
  )
}
