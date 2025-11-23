-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "courseId" TEXT;

-- CreateIndex
CREATE INDEX "PromoCode_courseId_idx" ON "PromoCode"("courseId");

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
