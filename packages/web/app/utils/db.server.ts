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
export async function createProperty(landlordId: string, address: string) {
  return db.property.create({
    data: {
      address,
      landlordId,
    },
  });
}

export async function getLandlordProperties(landlordId: string) {
  return db.property.findMany({
    where: { landlordId },
    include: {
      PropertyTenant: {
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
      TenantInvitation: {
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

  return db.TenantInvitation.create({
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
  return db.TenantInvitation.findMany({
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
  const invitation = await db.TenantInvitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new Error("Invalid or expired invitation");
  }

  // Create property-tenant relationship (lease)
  const lease = await db.PropertyTenant.create({
    data: {
      propertyId: invitation.propertyId,
      tenantId,
      startDate: invitation.startDate,
      endDate: invitation.endDate,
      status: "ACTIVE",
    },
  });

  // Update invitation status
  await db.TenantInvitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });

  return lease;
}

// Lease Management
export async function getActiveLease(tenantId: string, propertyId: string) {
  return db.PropertyTenant.findFirst({
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
  return db.PropertyTenant.findMany({
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
  return db.PropertyTenant.update({
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

export { db };
