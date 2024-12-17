import { RepairRequestStatusType } from "~/utils/blockchain/config";
import { type Address, type HexString } from "~/utils/blockchain/types";

export type BlockchainEvent = {
  type: 'created' | 'updated' | 'hashUpdated' | 'workDetailsUpdated';
  timestamp: bigint;
  data: {
    status?: RepairRequestStatusType;
    oldHash?: HexString;
    newHash?: HexString;
  };
};

export const formatTimestamp = (timestamp: bigint) => {
  return new Date(Number(timestamp) * 1000).toLocaleString();
};

// Get available status updates based on user role and current status
export function getAvailableStatusUpdates(
  currentStatus: string,
  userRole: string,
  isLandlord: boolean,
  isTenant: boolean
): RepairRequestStatusType[] {
  if (!isLandlord && !isTenant) return [];

  switch (currentStatus) {
    case 'PENDING':
      return isLandlord 
        ? [RepairRequestStatusType.IN_PROGRESS, RepairRequestStatusType.REJECTED]
        : [RepairRequestStatusType.CANCELLED];
    case 'IN_PROGRESS':
      return isLandlord 
        ? [RepairRequestStatusType.COMPLETED]
        : [];
    case 'COMPLETED':
      return isTenant
        ? [RepairRequestStatusType.ACCEPTED, RepairRequestStatusType.REFUSED]
        : [];
    default:
      return [];
  }
}

// Convert blockchain status enum to database status string
export const statusMap = {
  [RepairRequestStatusType.PENDING]: "PENDING",
  [RepairRequestStatusType.IN_PROGRESS]: "IN_PROGRESS",
  [RepairRequestStatusType.COMPLETED]: "COMPLETED",
  [RepairRequestStatusType.ACCEPTED]: "ACCEPTED",
  [RepairRequestStatusType.REFUSED]: "REFUSED",
  [RepairRequestStatusType.REJECTED]: "REJECTED",
  [RepairRequestStatusType.CANCELLED]: "CANCELLED",
} as const;
