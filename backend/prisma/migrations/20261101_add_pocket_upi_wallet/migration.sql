-- Additive Migration: Add Wallet and WalletLedgerEntry for NIYAT Pocket UPI
-- Non-destructive: Uses CREATE TABLE IF NOT EXISTS and guarded foreign keys.

CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "balancePaise" INTEGER NOT NULL DEFAULT 500000,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isDemoWallet" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_ownerId_key" ON "Wallet"("ownerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_upiId_key" ON "Wallet"("upiId");
CREATE INDEX IF NOT EXISTS "Wallet_upiId_idx" ON "Wallet"("upiId");
CREATE INDEX IF NOT EXISTS "Wallet_ownerType_idx" ON "Wallet"("ownerType");

CREATE TABLE IF NOT EXISTS "WalletLedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "feePaise" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "sourceWalletId" TEXT,
    "targetWalletId" TEXT,
    "sourceUpiId" TEXT NOT NULL,
    "targetUpiId" TEXT NOT NULL,
    "contractId" TEXT,
    "assessmentId" TEXT,
    "verifierDecision" TEXT,
    "isDemoData" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WalletLedgerEntry_transactionRef_key" ON "WalletLedgerEntry"("transactionRef");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_sourceWalletId_idx" ON "WalletLedgerEntry"("sourceWalletId");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_targetWalletId_idx" ON "WalletLedgerEntry"("targetWalletId");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_type_idx" ON "WalletLedgerEntry"("type");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_createdAt_idx" ON "WalletLedgerEntry"("createdAt");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'WalletLedgerEntry_sourceWalletId_fkey'
    ) THEN
        ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_sourceWalletId_fkey" FOREIGN KEY ("sourceWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'WalletLedgerEntry_targetWalletId_fkey'
    ) THEN
        ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_targetWalletId_fkey" FOREIGN KEY ("targetWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
