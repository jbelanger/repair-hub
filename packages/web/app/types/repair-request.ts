import { type Address } from "~/utils/blockchain/types";
import { RepairRequestStatusType } from "~/utils/blockchain/config";
import { type SerializedContractRepairRequest } from "~/utils/blockchain/types/repair-request";

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
  blockchainRequest: SerializedContractRepairRequest;
  user: {
    id: string;
    role: string;
    address: Address;
  };
  isLandlord: boolean;
  isTenant: boolean;
  availableStatusUpdates: RepairRequestStatusType[];
};

// Serialized version for display in UI
export type SerializedBlockchainRepairRequest = {
  descriptionHash: string;
  workDetailsHash: string;
  initiator: Address;
  createdAt: string;
  updatedAt: string;
};
