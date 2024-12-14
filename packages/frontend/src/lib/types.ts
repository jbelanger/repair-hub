// User related types
export const UserRoles = {
  TENANT: 'TENANT',
  LANDLORD: 'LANDLORD',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

// RepairRequest related types
export const RequestUrgencyLevels = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type RequestUrgency = typeof RequestUrgencyLevels[keyof typeof RequestUrgencyLevels];

export const RequestStatuses = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type RequestStatus = typeof RequestStatuses[keyof typeof RequestStatuses];

// RepairContract related types
export const ContractStatuses = {
  DRAFT: 'DRAFT',
  SIGNED: 'SIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ContractStatus = typeof ContractStatuses[keyof typeof ContractStatuses];

// Validation functions
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRoles).includes(role as UserRole);
};

export const isValidRequestUrgency = (urgency: string): urgency is RequestUrgency => {
  return Object.values(RequestUrgencyLevels).includes(urgency as RequestUrgency);
};

export const isValidRequestStatus = (status: string): status is RequestStatus => {
  return Object.values(RequestStatuses).includes(status as RequestStatus);
};

export const isValidContractStatus = (status: string): status is ContractStatus => {
  return Object.values(ContractStatuses).includes(status as ContractStatus);
};

// Error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Utility types
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
