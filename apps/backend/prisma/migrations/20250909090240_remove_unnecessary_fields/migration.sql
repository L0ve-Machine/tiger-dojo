/*
  Warnings:

  - You are about to drop the column `age` on the `PendingUser` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `PendingUser` table. All the data in the column will be lost.
  - You are about to drop the column `tradingExperience` on the `PendingUser` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PendingUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discordName" TEXT,
    "approvalToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PendingUser" ("approvalToken", "approvedAt", "approvedBy", "createdAt", "discordName", "email", "id", "name", "password", "rejectedAt", "rejectionReason", "requestedAt", "status", "updatedAt") SELECT "approvalToken", "approvedAt", "approvedBy", "createdAt", "discordName", "email", "id", "name", "password", "rejectedAt", "rejectionReason", "requestedAt", "status", "updatedAt" FROM "PendingUser";
DROP TABLE "PendingUser";
ALTER TABLE "new_PendingUser" RENAME TO "PendingUser";
CREATE UNIQUE INDEX "PendingUser_email_key" ON "PendingUser"("email");
CREATE UNIQUE INDEX "PendingUser_approvalToken_key" ON "PendingUser"("approvalToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
