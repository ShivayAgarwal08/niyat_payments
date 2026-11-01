import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Applying additive Pocket UPI migration...');
  // Split and execute statements one by one
  const statements = [
    `CREATE TABLE IF NOT EXISTS "Wallet" (
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
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_ownerId_key" ON "Wallet"("ownerId");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_upiId_key" ON "Wallet"("upiId");`,
    `CREATE INDEX IF NOT EXISTS "Wallet_upiId_idx" ON "Wallet"("upiId");`,
    `CREATE INDEX IF NOT EXISTS "Wallet_ownerType_idx" ON "Wallet"("ownerType");`,
    `CREATE TABLE IF NOT EXISTS "WalletLedgerEntry" (
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
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "WalletLedgerEntry_transactionRef_key" ON "WalletLedgerEntry"("transactionRef");`,
    `CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_sourceWalletId_idx" ON "WalletLedgerEntry"("sourceWalletId");`,
    `CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_targetWalletId_idx" ON "WalletLedgerEntry"("targetWalletId");`,
    `CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_type_idx" ON "WalletLedgerEntry"("type");`,
    `CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_createdAt_idx" ON "WalletLedgerEntry"("createdAt");`,
    `DO $$ BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'WalletLedgerEntry_sourceWalletId_fkey'
        ) THEN
            ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_sourceWalletId_fkey" FOREIGN KEY ("sourceWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END $$;`,
    `DO $$ BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'WalletLedgerEntry_targetWalletId_fkey'
        ) THEN
            ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_targetWalletId_fkey" FOREIGN KEY ("targetWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END $$;`
  ];

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log('✓ Pocket UPI Wallet tables and indexes ensured.');

  // Seed default user demo wallet if not existing
  const userWallet = await prisma.wallet.upsert({
    where: { ownerId: 'user_default' },
    update: {},
    create: {
      ownerId: 'user_default',
      ownerType: 'USER',
      ownerName: 'Primary User',
      upiId: 'user@niyat',
      balancePaise: 500000, // ₹5,000.00
      currency: 'INR',
      isDemoWallet: true
    }
  });
  console.log('✓ User Wallet ready:', userWallet.upiId, 'Balance: ₹' + (userWallet.balancePaise / 100));

  // Seed default merchant demo wallets
  const merchants = await prisma.merchant.findMany();
  for (const m of merchants) {
    const mWallet = await prisma.wallet.upsert({
      where: { ownerId: m.id },
      update: {
        upiId: m.payeeAddress,
        ownerName: m.name
      },
      create: {
        ownerId: m.id,
        ownerType: 'MERCHANT',
        ownerName: m.name,
        upiId: m.payeeAddress,
        balancePaise: 2500000, // ₹25,000.00
        currency: 'INR',
        isDemoWallet: true
      }
    });
    console.log('✓ Merchant Wallet ready:', mWallet.ownerName, 'UPI:', mWallet.upiId);
  }

  // Also seed a couple of peer users for P2P transfers
  await prisma.wallet.upsert({
    where: { ownerId: 'user_rahul' },
    update: {},
    create: {
      ownerId: 'user_rahul',
      ownerType: 'USER',
      ownerName: 'Rahul Sharma',
      upiId: 'rahul@niyat',
      balancePaise: 150000, // ₹1,500.00
      currency: 'INR',
      isDemoWallet: true
    }
  });

  await prisma.wallet.upsert({
    where: { ownerId: 'user_priya' },
    update: {},
    create: {
      ownerId: 'user_priya',
      ownerType: 'USER',
      ownerName: 'Priya Patel',
      upiId: 'priya@niyat',
      balancePaise: 200000, // ₹2,000.00
      currency: 'INR',
      isDemoWallet: true
    }
  });

  console.log('✓ Peer demo wallets ready (rahul@niyat, priya@niyat).');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
