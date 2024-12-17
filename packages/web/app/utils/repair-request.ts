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

// Validate status transitions according to smart contract rules
export function validateStatusTransition(currentStatus: string, newStatus: string): string | null {
  // Convert database status strings to blockchain enum values
  const currentEnum = Object.entries(statusMap).find(([_, value]) => value === currentStatus)?.[0];
  const newEnum = Object.entries(statusMap).find(([_, value]) => value === newStatus)?.[0];

  if (!currentEnum || !newEnum) {
    return "Invalid status value";
  }

  const current = parseInt(currentEnum);
  const next = parseInt(newEnum);

  // Define valid transitions using enum values
  const validTransitions: { [key in RepairRequestStatusType]: RepairRequestStatusType[] } = {
    [RepairRequestStatusType.PENDING]: [
      RepairRequestStatusType.IN_PROGRESS,
      RepairRequestStatusType.REJECTED,
      RepairRequestStatusType.CANCELLED
    ],
    [RepairRequestStatusType.IN_PROGRESS]: [
      RepairRequestStatusType.COMPLETED
    ],
    [RepairRequestStatusType.COMPLETED]: [
      RepairRequestStatusType.ACCEPTED,
      RepairRequestStatusType.REFUSED
    ],
    [RepairRequestStatusType.ACCEPTED]: [],
    [RepairRequestStatusType.REFUSED]: [],
    [RepairRequestStatusType.REJECTED]: [],
    [RepairRequestStatusType.CANCELLED]: []
  };

  if (!validTransitions[current as RepairRequestStatusType]?.includes(next as RepairRequestStatusType)) {
    return `Invalid transition from ${currentStatus} to ${newStatus}`;
  }

  return null;
}

// Convert blockchain status enum to database status string with proper typing
export const statusMap = {
  [RepairRequestStatusType.PENDING]: "PENDING",
  [RepairRequestStatusType.IN_PROGRESS]: "IN_PROGRESS",
  [RepairRequestStatusType.COMPLETED]: "COMPLETED",
  [RepairRequestStatusType.ACCEPTED]: "ACCEPTED",
  [RepairRequestStatusType.REFUSED]: "REFUSED",
  [RepairRequestStatusType.REJECTED]: "REJECTED",
  [RepairRequestStatusType.CANCELLED]: "CANCELLED",
} as const;

// Create a reverse mapping for looking up enum values from status strings
export const reverseStatusMap: { [K in typeof statusMap[keyof typeof statusMap]]: RepairRequestStatusType } = 
  Object.entries(statusMap).reduce((acc, [key, value]) => ({
    ...acc,
    [value]: Number(key) as RepairRequestStatusType
  }), {} as { [K in typeof statusMap[keyof typeof statusMap]]: RepairRequestStatusType });
