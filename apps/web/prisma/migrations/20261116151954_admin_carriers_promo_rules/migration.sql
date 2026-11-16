-- CreateEnum
CREATE TYPE "PromoScope" AS ENUM ('KIT', 'ORDER', 'SHIPPING');

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "maxUsesPerPhone" INTEGER,
ADD COLUMN     "minOrderMinor" INTEGER,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "scope" "PromoScope" NOT NULL DEFAULT 'ORDER';

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "ratesUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_code_key" ON "Carrier"("code");

-- Sociétés déjà présentes dans les modes de livraison (ZR Express, Yalidine…).
INSERT INTO "Carrier" ("id", "code", "name", "active", "ratesUpdatedAt", "updatedAt")
SELECT 'carrier_' || dm."provider",
       dm."provider",
       CASE dm."provider" WHEN 'zrexpress' THEN 'ZR Express' WHEN 'yalidine' THEN 'Yalidine' ELSE dm."provider" END,
       bool_or(dm."active"),
       max(r."updatedAt"),
       CURRENT_TIMESTAMP
FROM "DeliveryMethod" dm
LEFT JOIN "DeliveryRate" r ON r."deliveryMethodId" = dm."id"
GROUP BY dm."provider"
ON CONFLICT ("code") DO NOTHING;
