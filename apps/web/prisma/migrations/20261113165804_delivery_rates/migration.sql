-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryFeeMinor" INTEGER;

-- CreateTable
CREATE TABLE "DeliveryRate" (
    "id" TEXT NOT NULL,
    "deliveryMethodId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRate_deliveryMethodId_zone_key" ON "DeliveryRate"("deliveryMethodId", "zone");

-- AddForeignKey
ALTER TABLE "DeliveryRate" ADD CONSTRAINT "DeliveryRate_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "DeliveryMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
