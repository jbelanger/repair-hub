import { type Address, type HexString } from '../types'
import { RepairRequestStatusType } from '../config'

export interface BlockchainRepairRequestResult {
  id: bigint;
  hash: HexString;
}

export interface ContractRepairRequest {
  id: bigint;
  initiator: Address;
  landlord: Address;
  propertyId: string;
  descriptionHash: string;
  workDetailsHash: string;
  status: number;
  createdAt: bigint;
  updatedAt: bigint;
}

export type DecodedEventArgs = {
  id: bigint;
  initiator: Address;
  landlord: Address;
} & (
  | {
      propertyId: string;
      descriptionHash: string;
      createdAt: bigint;
    }
  | {
      oldStatus: bigint;
      newStatus: bigint;
      updatedAt: bigint;
    }
  | {
      oldHash: string;
      newHash: string;
      updatedAt: bigint;
    }
);

export type ContractError = {
  code: string;
  message: string;
}

export type ContractFunctionName = 
  | 'createRepairRequest'
  | 'updateRepairRequestStatus'
  | 'updateDescription'
  | 'updateWorkDetails'
  | 'withdrawRepairRequest'
  | 'approveWork';

export type ContractFunctionArgs = {
  createRepairRequest: readonly [string, string, Address];
  updateRepairRequestStatus: readonly [bigint, bigint];
  updateDescription: readonly [bigint, string];
  updateWorkDetails: readonly [bigint, string];
  withdrawRepairRequest: readonly [bigint];
  approveWork: readonly [bigint, boolean];
};
