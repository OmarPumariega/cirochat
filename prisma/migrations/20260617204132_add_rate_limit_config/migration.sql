-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "blockDurationHours" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maxMessagesPerConv" INTEGER NOT NULL DEFAULT 50;
