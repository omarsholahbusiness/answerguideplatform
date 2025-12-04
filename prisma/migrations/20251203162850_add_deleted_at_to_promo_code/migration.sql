-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PromoCode_deletedAt_idx" ON "PromoCode"("deletedAt");

