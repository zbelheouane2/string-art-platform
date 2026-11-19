-- Avancement du guide enregistré côté serveur (reprise sur un autre appareil).
ALTER TABLE "Generation" ADD COLUMN "guideStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Generation" ADD COLUMN "guideStepAt" TIMESTAMP(3);
