-- Portrait terminé, puis effacement de ses instructions après le délai prévu.
ALTER TABLE "Generation" ADD COLUMN "guideDoneAt" TIMESTAMP(3);
ALTER TABLE "Generation" ADD COLUMN "purgedAt" TIMESTAMP(3);
CREATE INDEX "Generation_guideDoneAt_idx" ON "Generation"("guideDoneAt");
