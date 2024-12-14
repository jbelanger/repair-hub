import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const UserRoles = {
  TENANT: 'TENANT',
  LANDLORD: 'LANDLORD',
  ADMIN: 'ADMIN',
} as const

export type UserRole = typeof UserRoles[keyof typeof UserRoles]

export interface CreateUserInput {
  name: string
  email: string
  address: string // Ethereum address
  phone?: string
  role: UserRole
}

export interface UpdateUserInput {
  name?: string
  email?: string
  phone?: string
  role?: UserRole
}

export class UserService {
  static async createUser(input: CreateUserInput) {
    try {
      const user = await prisma.user.create({
        data: {
          ...input,
        },
      })
      return user
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  static async getUserByAddress(address: string) {
    try {
      const user = await prisma.user.findFirst({
        where: { address },
        include: {
          initiatedRequests: true,
          tenancies: true,          
        },
      })
      return user
    } catch (error) {
      console.error('Error getting user:', error)
      throw error
    }
  }

  static async updateUser(id: string, input: UpdateUserInput) {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: input,
        include: {
          initiatedRequests: true,
          tenancies: true,
        },
      })
      return user
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  static async addPropertyForLandlord(userId: string, propertyAddress: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user || user.role !== UserRoles.LANDLORD) {
        throw new Error('User must be a landlord to add properties')
      }

      const property = await prisma.property.create({
        data: {
          address: propertyAddress,
          landlordId: userId,
        },
        include: {
          landlord: true,
          tenants: true,
        },
      })

      return property
    } catch (error) {
      console.error('Error adding property:', error)
      throw error
    }
  }

  static async getLandlordProperties(userId: string) {
    try {
      const properties = await prisma.property.findMany({
        where: { landlordId: userId },
        include: {
          landlord: true,
          tenants: true,
        },
      })
      return properties
    } catch (error) {
      console.error('Error getting landlord properties:', error)
      throw error
    }
  }

  static async getTenantProperties(userId: string) {
    try {
      const properties = await prisma.property.findMany({
        where: {
          tenants: {
            some: {
              id: userId,
            },
          },
        },
        include: {
          landlord: true,
          tenants: true,
        },
      })
      return properties
    } catch (error) {
      console.error('Error getting tenant properties:', error)
      throw error
    }
  }

  static async assignTenantToProperty(tenantId: string, propertyId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: tenantId },
      })

      if (!user || user.role !== UserRoles.TENANT) {
        throw new Error('User must be a tenant to be assigned to a property')
      }

      const property = await prisma.property.update({
        where: { id: propertyId },
        data: {
          tenants: {
            connect: { id: tenantId },
          },
        },
        include: {
          landlord: true,
          tenants: true,
        },
      })

      return property
    } catch (error) {
      console.error('Error assigning tenant to property:', error)
      throw error
    }
  }
}
