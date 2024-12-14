/*
  Warnings:

  - You are about to drop the `_PropertyTenants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `repairRequestId` on the `RepairContract` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[address]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requestId` to the `RepairContract` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_PropertyTenants_B_index";

-- DropIndex
DROP INDEX "_PropertyTenants_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_PropertyTenants";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_TenantProperties" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TenantProperties_A_fkey" FOREIGN KEY ("A") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TenantProperties_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RepairContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "agreedPrice" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "completionDate" DATETIME,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairContract_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RepairRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairContract_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RepairContract" ("agreedPrice", "completionDate", "contractorId", "createdAt", "hash", "id", "startDate", "status", "updatedAt") SELECT "agreedPrice", "completionDate", "contractorId", "createdAt", "hash", "id", "startDate", "status", "updatedAt" FROM "RepairContract";
DROP TABLE "RepairContract";
ALTER TABLE "new_RepairContract" RENAME TO "RepairContract";
CREATE TABLE "new_RepairRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiatorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attachments" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairRequest_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RepairRequest" ("attachments", "createdAt", "description", "hash", "id", "initiatorId", "propertyId", "status", "updatedAt", "urgency") SELECT "attachments", "createdAt", "description", "hash", "id", "initiatorId", "propertyId", "status", "updatedAt", "urgency" FROM "RepairRequest";
DROP TABLE "RepairRequest";
ALTER TABLE "new_RepairRequest" RENAME TO "RepairRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_TenantProperties_AB_unique" ON "_TenantProperties"("A", "B");

-- CreateIndex
CREATE INDEX "_TenantProperties_B_index" ON "_TenantProperties"("B");

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");
