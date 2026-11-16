-- CreateEnum
CREATE TYPE "PromoKind" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promoCode" TEXT;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "PromoKind" NOT NULL,
    "value" INTEGER NOT NULL,
    "currency" CHAR(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
