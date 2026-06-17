-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "blockedUntil" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT;
