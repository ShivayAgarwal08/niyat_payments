-- Additive Migration: Add MarketAssessment and audit fields to SimulatedTransaction
-- Non-destructive: Uses IF NOT EXISTS and guarded foreign keys.

-- 1. SimulatedTransaction audit fields
ALTER TABLE "SimulatedTransaction" ADD COLUMN IF NOT EXISTS "assessmentId" TEXT;
ALTER TABLE "SimulatedTransaction" ADD COLUMN IF NOT EXISTS "marketDecision" TEXT;
ALTER TABLE "SimulatedTransaction" ADD COLUMN IF NOT EXISTS "marketDecisionReason" TEXT;
ALTER TABLE "SimulatedTransaction" ADD COLUMN IF NOT EXISTS "userAcknowledgedAdvisory" BOOLEAN;

-- 2. Create MarketAssessment Table
CREATE TABLE IF NOT EXISTS "MarketAssessment" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "packageSizeBaseUnits" INTEGER NOT NULL,
    "baseUnit" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "payeeAddress" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "basePricePaise" INTEGER NOT NULL,
    "deliveryFeePaise" INTEGER NOT NULL,
    "platformFeePaise" INTEGER NOT NULL,
    "discountPaise" INTEGER NOT NULL,
    "landedPricePaise" INTEGER NOT NULL,
    "pricePerStandardUnitPaise" INTEGER NOT NULL,
    "feeSkewBps" INTEGER NOT NULL,
    "decision" TEXT NOT NULL,
    "decisionReason" TEXT NOT NULL,
    "requiresAcknowledgement" BOOLEAN NOT NULL,
    "bindingSignature" TEXT NOT NULL,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketAssessment_pkey" PRIMARY KEY ("id")
);

-- 3. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "MarketAssessment_assessmentId_key" ON "MarketAssessment"("assessmentId");
CREATE INDEX IF NOT EXISTS "MarketAssessment_contractId_idx" ON "MarketAssessment"("contractId");
CREATE INDEX IF NOT EXISTS "MarketAssessment_isConsumed_idx" ON "MarketAssessment"("isConsumed");

-- 4. Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MarketAssessment_productId_fkey'
    ) THEN
        ALTER TABLE "MarketAssessment" ADD CONSTRAINT "MarketAssessment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MarketAssessment_merchantId_fkey'
    ) THEN
        ALTER TABLE "MarketAssessment" ADD CONSTRAINT "MarketAssessment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
