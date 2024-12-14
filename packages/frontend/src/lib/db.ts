import { PrismaClient } from '@prisma/client'
import {
  UserRole,
  RequestUrgency,
  RequestStatus,
  ContractStatus,
  ValidationError,
  DatabaseError,
  isValidUserRole,
  isValidRequestUrgency,
  isValidRequestStatus,
  isValidContractStatus,
} from './types'

const prisma = new PrismaClient()

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
  phone?: string
  address: string
}

export interface CreatePropertyInput {
  address: string
  landlordId: string
}

export interface CreateRepairRequestInput {
  initiatorId: string
  propertyId: string
  description: string
  urgency: RequestUrgency
  attachments: string[]
  hash: string
}

export interface CreateContractorInput {
  name: string
  specialization: string
  phone: string
  email?: string
}

export interface CreateRepairContractInput {
  repairRequestId: string
  contractorId: string
  agreedPrice: number
  startDate: Date
  hash: string
}

const handleError = (error: unknown, operation: string): never => {
  const message = error instanceof Error ? error.message : String(error)
  throw new DatabaseError(`Failed to ${operation}: ${message}`)
}

export const db = {
  // User operations
  createUser: async (data: CreateUserInput) => {
    if (!isValidUserRole(data.role)) {
      throw new ValidationError(`Invalid user role: ${data.role}`)
    }

    try {
      return await prisma.user.create({
        data: {
          ...data,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'create user')
    }
  },

  getUserById: async (id: string) => {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          properties: true,
          tenancies: true,
          repairRequests: true,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'get user')
    }
  },

  getUserByEmail: async (email: string) => {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          properties: true,
          tenancies: true,
          repairRequests: true,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'get user by email')
    }
  },

  // Property operations
  createProperty: async (data: CreatePropertyInput) => {
    try {
      return await prisma.property.create({
        data: {
          ...data,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'create property')
    }
  },

  getPropertyById: async (id: string) => {
    try {
      return await prisma.property.findUnique({
        where: { id },
        include: {
          landlord: true,
          tenants: true,
          repairs: true,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'get property')
    }
  },

  addTenantToProperty: async (propertyId: string, tenantId: string) => {
    try {
      return await prisma.property.update({
        where: { id: propertyId },
        data: {
          tenants: {
            connect: { id: tenantId },
          },
        },
      })
    } catch (error: unknown) {
      handleError(error, 'add tenant to property')
    }
  },

  // RepairRequest operations
  createRepairRequest: async (data: CreateRepairRequestInput) => {
    if (!isValidRequestUrgency(data.urgency)) {
      throw new ValidationError(`Invalid request urgency: ${data.urgency}`)
    }

    try {
      return await prisma.repairRequest.create({
        data: {
          ...data,
          status: 'PENDING',
          attachments: JSON.stringify(data.attachments),
        },
      })
    } catch (error: unknown) {
      handleError(error, 'create repair request')
    }
  },

  getRepairRequestById: async (id: string) => {
    try {
      return await prisma.repairRequest.findUnique({
        where: { id },
        include: {
          initiator: true,
          property: true,
          contracts: {
            include: {
              contractor: true,
            },
          },
        },
      })
    } catch (error: unknown) {
      handleError(error, 'get repair request')
    }
  },

  updateRepairRequestStatus: async (id: string, status: RequestStatus) => {
    if (!isValidRequestStatus(status)) {
      throw new ValidationError(`Invalid request status: ${status}`)
    }

    try {
      return await prisma.repairRequest.update({
        where: { id },
        data: { status },
      })
    } catch (error: unknown) {
      handleError(error, 'update repair request status')
    }
  },

  // Contractor operations
  createContractor: async (data: CreateContractorInput) => {
    try {
      return await prisma.contractor.create({
        data: {
          ...data,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'create contractor')
    }
  },

  getContractorById: async (id: string) => {
    try {
      return await prisma.contractor.findUnique({
        where: { id },
        include: {
          contracts: true,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'get contractor')
    }
  },

  // RepairContract operations
  createRepairContract: async (data: CreateRepairContractInput) => {
    try {
      return await prisma.repairContract.create({
        data: {
          ...data,
          status: 'DRAFT',
        },
      })
    } catch (error: unknown) {
      handleError(error, 'create repair contract')
    }
  },

  getRepairContractById: async (id: string) => {
    try {
      return await prisma.repairContract.findUnique({
        where: { id },
        include: {
          repairRequest: true,
          contractor: true,
        },
      })
    } catch (error: unknown) {
      handleError(error, 'get repair contract')
    }
  },

  updateRepairContractStatus: async (id: string, status: ContractStatus) => {
    if (!isValidContractStatus(status)) {
      throw new ValidationError(`Invalid contract status: ${status}`)
    }

    try {
      return await prisma.repairContract.update({
        where: { id },
        data: { status },
      })
    } catch (error: unknown) {
      handleError(error, 'update repair contract status')
    }
  },
}

export type DB = typeof db
