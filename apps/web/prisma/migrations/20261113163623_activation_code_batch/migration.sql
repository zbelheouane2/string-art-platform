-- AlterTable
ALTER TABLE "ActivationCode" ADD COLUMN     "batch" TEXT;

-- CreateIndex
CREATE INDEX "ActivationCode_batch_idx" ON "ActivationCode"("batch");
