import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  db = global.__db__;
  db.$connect();
}

// Property Management
export async function createProperty(landlordId: string, address: string, placeId: string) {
  return db.property.create({
    data: {
      address,
      placeId,
      landlordId,
    },
  });
}

export async function getLandlordProperties(landlordId: string) {
  return db.property.findMany({
    where: { landlordId },
    include: {
      tenantLeases: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      invitations: {
        where: {
          status: "PENDING",
        },
      },
    },
  });
}

// Tenant Invitation Management
export async function createTenantInvitation(
  propertyId: string,
  email: string,
  startDate: Date,
  endDate: Date
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Invitation expires in 7 days

  return db.tenantInvitation.create({
    data: {
      propertyId,
      email,
      startDate,
      endDate,
      status: "PENDING",
      expiresAt,
    },
  });
}

export async function getPendingInvitationsByEmail(email: string) {
  return db.tenantInvitation.findMany({
    where: {
      email,
      status: "PENDING",
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      property: {
        include: {
          landlord: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function acceptInvitation(invitationId: string, tenantId: string) {
  const invitation = await db.tenantInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new Error("Invalid or expired invitation");
  }

  // Create property-tenant relationship (lease)
  const lease = await db.propertyTenant.create({
    data: {
      propertyId: invitation.propertyId,
      tenantId,
      startDate: invitation.startDate,
      endDate: invitation.endDate,
      status: "ACTIVE",
    },
  });

  // Update invitation status
  await db.tenantInvitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });

  return lease;
}

// Lease Management
export async function getActiveLease(tenantId: string, propertyId: string) {
  return db.propertyTenant.findFirst({
    where: {
      tenantId,
      propertyId,
      status: "ACTIVE",
      endDate: {
        gt: new Date(), // Not expired
      },
    },
  });
}

export async function getActiveLeasesByTenant(tenantId: string) {
  return db.propertyTenant.findMany({
    where: {
      tenantId,
      status: "ACTIVE",
      endDate: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      property: {
        include: {
          landlord: {
            select: {
              name: true,
              email: true,
              address: true, // Ethereum address
            },
          },
        },
      },
    },
  });
}

export async function terminateLease(leaseId: string) {
  return db.propertyTenant.update({
    where: { id: leaseId },
    data: { status: "TERMINATED" },
  });
}

// Utility function to check if a user has an active lease for a property
export async function hasActiveLease(userId: string, propertyId: string): Promise<boolean> {
  const lease = await getActiveLease(userId, propertyId);
  return !!lease;
}

// Utility function to get property with landlord details
export async function getPropertyWithLandlord(propertyId: string) {
  return db.property.findUnique({
    where: { id: propertyId },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true, // Ethereum address
        },
      },
    },
  });
}

// Repair Request Management

// Convert blockchain status to database status
function blockchainToDbStatus(status: number): string {
  const statusMap: Record<number, string> = {
    0: "PENDING",
    1: "IN_PROGRESS",
    2: "COMPLETED",
    3: "ACCEPTED",
    4: "REFUSED",
    5: "REJECTED",
    6: "CANCELLED"
  };
  return statusMap[status] || "PENDING";
}

// Create a new repair request
export async function createRepairRequest({
  id,
  initiatorId,
  propertyId,
  leaseId,
  description,
  descriptionHash,
  urgency,
  attachments = "",
}: {
  id: string;
  initiatorId: string;
  propertyId: string;
  leaseId: string;
  description: string;
  descriptionHash: string;
  urgency: string;
  attachments?: string;
}) {
  return db.repairRequest.create({
    data: {
      id,
      initiatorId,
      propertyId,
      leaseId,
      description,
      descriptionHash,
      urgency,
      attachments,
      status: "PENDING",
      workDetails: "",
      workDetailsHash: "",
    },
  });
}

// Update repair request status
export async function updateRepairRequestStatus(id: string, status: number) {
  return db.repairRequest.update({
    where: { id },
    data: {
      status: blockchainToDbStatus(status),
    },
  });
}

// Update work details
export async function updateWorkDetails(id: string, workDetails: string, workDetailsHash: string) {
  return db.repairRequest.update({
    where: { id },
    data: {
      workDetails,
      workDetailsHash,
    },
  });
}

// Update description
export async function updateDescription(id: string, description: string, descriptionHash: string) {
  return db.repairRequest.update({
    where: { id },
    data: {
      description,
      descriptionHash,
    },
  });
}

// Get repair request by ID with all related data
export async function getRepairRequest(id: string) {
  return db.repairRequest.findUnique({
    where: { id },
    include: {
      initiator: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
        },
      },
      property: {
        include: {
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true,
            },
          },
        },
      },
      lease: true,
    },
  });
}

// Get repair requests for a property
export async function getPropertyRepairRequests(propertyId: string) {
  return db.repairRequest.findMany({
    where: { propertyId },
    include: {
      initiator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      lease: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Get repair requests initiated by a user
export async function getUserRepairRequests(userId: string) {
  return db.repairRequest.findMany({
    where: { initiatorId: userId },
    include: {
      property: {
        include: {
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true,
            },
          },
        },
      },
      lease: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export { db };
