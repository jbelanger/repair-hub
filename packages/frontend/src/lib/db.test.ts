import { PrismaClient } from '@prisma/client'
import { db } from './db'
import { UserRoles, RequestUrgencyLevels, DatabaseError } from './types'

const prisma = new PrismaClient()

class TestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TestError'
  }
}

async function testDatabaseOperations() {
  try {
    console.log('Starting database operations test...')

    // Create a landlord user
    const landlord = await db.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRoles.LANDLORD,
      phone: '123-456-7890',
      address: '123 Main St',
    })
    
    if (!landlord) {
      throw new TestError('Failed to create landlord')
    }
    console.log('Created landlord:', landlord)

    // Create a tenant user
    const tenant = await db.createUser({
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: UserRoles.TENANT,
      phone: '098-765-4321',
      address: '456 Oak Ave',
    })
    
    if (!tenant) {
      throw new TestError('Failed to create tenant')
    }
    console.log('Created tenant:', tenant)

    // Create a property
    const property = await db.createProperty({
      address: '789 Pine St',
      landlordId: landlord.id,
    })
    
    if (!property) {
      throw new TestError('Failed to create property')
    }
    console.log('Created property:', property)

    // Add tenant to property
    const updatedProperty = await db.addTenantToProperty(property.id, tenant.id)
    if (!updatedProperty) {
      throw new TestError('Failed to add tenant to property')
    }
    console.log('Added tenant to property:', updatedProperty)

    // Create a repair request
    const repairRequest = await db.createRepairRequest({
      initiatorId: tenant.id,
      propertyId: property.id,
      description: 'Leaky faucet in kitchen',
      urgency: RequestUrgencyLevels.MEDIUM,
      attachments: ['ipfs://hash1', 'ipfs://hash2'],
      hash: 'request-hash-123',
    })
    
    if (!repairRequest) {
      throw new TestError('Failed to create repair request')
    }
    console.log('Created repair request:', repairRequest)

    // Create a contractor
    const contractor = await db.createContractor({
      name: 'Bob\'s Plumbing',
      specialization: 'Plumbing',
      phone: '555-123-4567',
      email: 'bob@plumbing.com',
    })
    
    if (!contractor) {
      throw new TestError('Failed to create contractor')
    }
    console.log('Created contractor:', contractor)

    // Create a repair contract
    const repairContract = await db.createRepairContract({
      repairRequestId: repairRequest.id,
      contractorId: contractor.id,
      agreedPrice: 150.00,
      startDate: new Date(),
      hash: 'contract-hash-123',
    })
    
    if (!repairContract) {
      throw new TestError('Failed to create repair contract')
    }
    console.log('Created repair contract:', repairContract)

    // Test fetching data with relationships
    const fetchedRequest = await db.getRepairRequestById(repairRequest.id)
    if (!fetchedRequest) {
      throw new TestError('Failed to fetch repair request')
    }
    console.log('Fetched repair request with relationships:', fetchedRequest)

    // Clean up test data
    await cleanupTestData(landlord.id, tenant.id, property.id, repairRequest.id, contractor.id, repairContract.id)

    console.log('All database operations completed successfully!')
    return true
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof TestError) {
      console.error('Error during database operations test:', error.message)
    } else {
      console.error('Unexpected error during database operations test:', error)
    }
    return false
  } finally {
    // Disconnect from the database
    await prisma.$disconnect()
  }
}

async function cleanupTestData(
  landlordId: string,
  tenantId: string,
  propertyId: string,
  repairRequestId: string,
  contractorId: string,
  repairContractId: string
) {
  try {
    // Note: Due to foreign key constraints, we need to delete in the correct order
    // First delete contracts
    await prisma.repairContract.delete({ where: { id: repairContractId } })
    
    // Then delete repair requests
    await prisma.repairRequest.delete({ where: { id: repairRequestId } })
    
    // Delete contractor
    await prisma.contractor.delete({ where: { id: contractorId } })
    
    // Delete property (this will also remove tenant relationships)
    await prisma.property.delete({ where: { id: propertyId } })
    
    // Finally delete users
    await prisma.user.delete({ where: { id: landlordId } })
    await prisma.user.delete({ where: { id: tenantId } })
    
    console.log('Test data cleaned up successfully')
  } catch (error) {
    console.error('Error cleaning up test data:', error)
    // Don't throw here as this is cleanup code
  }
}

// Run the test
console.log('Starting database tests...')
testDatabaseOperations().then((success) => {
  if (success) {
    console.log('✅ Database test completed successfully!')
  } else {
    console.log('❌ Database test failed!')
    process.exit(1)
  }
}).catch((error) => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
