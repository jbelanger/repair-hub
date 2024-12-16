-- Step 1: Add nullable placeId column
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "placeId" TEXT,
    "landlordId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 2: Copy existing data with a temporary placeId based on address
INSERT INTO "new_Property" ("id", "address", "placeId", "landlordId", "createdAt", "updatedAt")
SELECT "id", "address", "address" || '_legacy', "landlordId", "createdAt", "updatedAt"
FROM "Property";

-- Step 3: Drop old table and rename new one
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";

-- Step 4: Make placeId required now that we have default values
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Property" SELECT * FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";

PRAGMA foreign_keys=ON;
