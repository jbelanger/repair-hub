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

// Get valid transitions for a given status according to the contract rules
export function getValidTransitions(status: RepairRequestStatusType): RepairRequestStatusType[] {
  switch (status) {
    case RepairRequestStatusType.PENDING:
      return [
        RepairRequestStatusType.IN_PROGRESS,
        RepairRequestStatusType.REJECTED,
        RepairRequestStatusType.CANCELLED
      ];
    case RepairRequestStatusType.IN_PROGRESS:
      return [RepairRequestStatusType.COMPLETED];
    case RepairRequestStatusType.COMPLETED:
      return [
        RepairRequestStatusType.ACCEPTED,
        RepairRequestStatusType.REFUSED
      ];
    default:
      return [];
  }
}

// Validate status transitions according to smart contract rules
export function validateStatusTransition(currentStatus: string, newStatus: string): string | null {
  // Convert database status strings to blockchain enum values
  const currentEnum = reverseStatusMap[currentStatus as keyof typeof reverseStatusMap];
  const newEnum = reverseStatusMap[newStatus as keyof typeof reverseStatusMap];

  if (currentEnum === undefined || newEnum === undefined) {
    return "Invalid status value";
  }

  // Check if the status is final (cannot be changed)
  if (currentEnum === RepairRequestStatusType.ACCEPTED ||
      currentEnum === RepairRequestStatusType.REFUSED ||
      currentEnum === RepairRequestStatusType.REJECTED ||
      currentEnum === RepairRequestStatusType.CANCELLED) {
    return `Cannot update status: ${currentStatus} is a final status`;
  }

  // Get valid transitions for the current status
  const validTransitions = getValidTransitions(currentEnum);

  // Check if the new status is a valid transition
  if (!validTransitions.includes(newEnum)) {
    return `Invalid transition from ${currentStatus} to ${newStatus}`;
  }

  return null;
}

// Validate withdraw request conditions according to contract rules
export function validateWithdrawRequest(status: string): string | null {
  // Convert database status string to enum
  const currentEnum = reverseStatusMap[status as keyof typeof reverseStatusMap];
  if (currentEnum === undefined) {
    return "Invalid status value";
  }

  // Check if the status is final (cannot be changed)
  if (currentEnum === RepairRequestStatusType.ACCEPTED ||
      currentEnum === RepairRequestStatusType.REFUSED ||
      currentEnum === RepairRequestStatusType.REJECTED ||
      currentEnum === RepairRequestStatusType.CANCELLED) {
    return `Cannot withdraw request: ${status} is a final status`;
  }

  // Check if request is in PENDING status
  if (currentEnum !== RepairRequestStatusType.PENDING) {
    return "Can only withdraw pending requests";
  }

  return null;
}

// Validate approve work conditions according to contract rules
export function validateApproveWork(status: string): string | null {
  // Convert database status string to enum
  const currentEnum = reverseStatusMap[status as keyof typeof reverseStatusMap];
  if (currentEnum === undefined) {
    return "Invalid status value";
  }

  // Check if the status is final (cannot be changed)
  if (currentEnum === RepairRequestStatusType.ACCEPTED ||
      currentEnum === RepairRequestStatusType.REFUSED ||
      currentEnum === RepairRequestStatusType.REJECTED ||
      currentEnum === RepairRequestStatusType.CANCELLED) {
    return `Cannot approve/refuse work: ${status} is a final status`;
  }

  // Check if request is in COMPLETED status
  if (currentEnum !== RepairRequestStatusType.COMPLETED) {
    return "Can only approve/refuse completed work";
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
