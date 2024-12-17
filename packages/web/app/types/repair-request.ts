import { type Address } from "~/utils/blockchain/types";
import { RepairRequestStatusType } from "~/utils/blockchain/config";

export type LoaderData = {
  repairRequest: {
    id: string;
    description: string;
    urgency: string;
    status: string;
    attachments: string;
    workDetails: string | null;
    workDetailsHash: string | null;
    createdAt: string;
    updatedAt: string;
    property: {
      id: string;
      address: string;
      landlord: {
        id: string;
        name: string;
        address: Address;
      };
    };
    initiator: {
      id: string;
      name: string;
      address: Address;
    };
  };
  user: {
    id: string;
    role: string;
    address: Address;
  };
  availableStatusUpdates: RepairRequestStatusType[];
};

export type BlockchainRepairRequest = {
  descriptionHash: string;
  workDetailsHash: string;
  initiator: Address;
  createdAt: bigint;
  updatedAt: bigint;
};
