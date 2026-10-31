import { PrismaClient } from '@prisma/client';
import { SEED_MERCHANTS, SEED_PRODUCTS, SEED_HISTORICAL_PRICES } from '../src/db/marketplaceData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NIYAT database with synthetic marketplace data...');

  // Upsert Merchants
  for (const m of SEED_MERCHANTS) {
    await prisma.merchant.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        rating: m.rating,
        isVerified: m.isVerified,
        payeeAddress: m.payeeAddress,
        deliveryFeePaise: m.deliveryFeePaise,
        platformFeePaise: m.platformFeePaise
      },
      create: {
        id: m.id,
        name: m.name,
        slug: m.slug,
        rating: m.rating,
        isVerified: m.isVerified,
        payeeAddress: m.payeeAddress,
        deliveryFeePaise: m.deliveryFeePaise,
        platformFeePaise: m.platformFeePaise
      }
    });
  }

  // Upsert Products
  for (const p of SEED_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        category: p.category,
        brand: p.brand,
        variant: p.variant,
        unit: p.unit,
        packageSize: p.packageSize,
        basePricePaise: p.basePricePaise,
        discountPaise: p.discountPaise,
        inStock: p.inStock,
        description: p.description,
        maliciousInstruction: p.maliciousInstruction,
        merchantId: p.merchantId
      },
      create: {
        id: p.id,
        title: p.title,
        category: p.category,
        brand: p.brand,
        variant: p.variant,
        unit: p.unit,
        packageSize: p.packageSize,
        basePricePaise: p.basePricePaise,
        discountPaise: p.discountPaise,
        inStock: p.inStock,
        description: p.description,
        maliciousInstruction: p.maliciousInstruction,
        merchantId: p.merchantId
      }
    });
  }

  // Insert Historical Prices safely without duplicating existing records
  for (const h of SEED_HISTORICAL_PRICES) {
    const existing = await prisma.marketPrice.findFirst({
      where: {
        productId: h.productId,
        observedDate: new Date(h.observedDate),
        sourceMerchant: h.sourceMerchant
      }
    });

    if (!existing) {
      await prisma.marketPrice.create({
        data: {
          productId: h.productId,
          pricePaise: h.pricePaise,
          observedDate: new Date(h.observedDate),
          sourceMerchant: h.sourceMerchant,
          isDemoData: true
        }
      });
    }
  }

  console.log('Seeding completed successfully with DEMO DATA!');
}

main()
  .catch((e) => {
    console.error('Seeding error (Note: If DATABASE_URL is not set, repository uses local fallback store):', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
