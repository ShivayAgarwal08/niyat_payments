import { AIService } from '../ai/aiService.js';
import { MarketplaceRepository } from '../db/repository.js';
import { createSignedIntentContract } from '../contract/intentContract.js';
import { BlindVerifier } from '../verifier/blindVerifier.js';
import {
  SignedIntentContract,
  PurchaseAuthorization,
  BlindVerifierDecision,
  MarketIntelligenceReport
} from '../types/index.js';

export interface ProtectedModeResult {
  step: 'INTENT_SIGNED' | 'MARKET_ANALYZED' | 'VERIFIED';
  contract: SignedIntentContract;
  marketIntelligence: MarketIntelligenceReport;
  recommendedOffer: MarketIntelligenceReport['offers'][0];
  authorization?: PurchaseAuthorization;
  verifierDecision?: BlindVerifierDecision;
  simulatedPaymentResult?: {
    txId: string;
    status: 'PAID' | 'REJECTED' | 'CONFIRMATION_REQUIRED';
    amountPaise: number;
    payeeAddress: string;
    timestamp: string;
  };
}

export class ProtectedModeSimulator {
  private verifier: BlindVerifier;

  constructor(
    private aiService: AIService,
    private repository: MarketplaceRepository
  ) {
    this.verifier = new BlindVerifier(this.repository);
  }

  /**
   * Step 1 to 6: Extracts intent, signs contract, runs Market Intelligence, and prepares recommendation.
   */
  async prepareProtectedPurchase(userPrompt: string): Promise<{
    contract: SignedIntentContract;
    marketIntelligence: MarketIntelligenceReport;
    recommendedOffer: MarketIntelligenceReport['offers'][0];
  }> {
    // 1 & 2. Structured intent extraction via AI service (with local fallback)
    const { intent } = await this.aiService.parseIntent(userPrompt);

    // 3. Cryptographically sign intent contract
    const contract = createSignedIntentContract(userPrompt, intent);
    await this.repository.saveContract(contract);

    // 4 & 5. Find matching product in catalog
    const category = intent.productCategory !== 'Unknown' ? intent.productCategory : 'Milk';
    const products = await this.repository.getProducts({
      category,
      search: intent.preferredBrand !== 'Unknown' ? intent.preferredBrand : undefined
    });

    const targetProduct = products[0] || (await this.repository.getProducts())[0];

    // Market Intelligence analysis (inside NIYAT Protected Mode)
    const marketReport = await this.repository.getMarketIntelligence(targetProduct.id);
    if (!marketReport) {
      throw new Error('Unable to generate market intelligence report for product');
    }

    const recommendedOffer = marketReport.offers.find(o => o.isRecommended) || marketReport.offers[0];

    return {
      contract,
      marketIntelligence: marketReport,
      recommendedOffer
    };
  }

  /**
   * Step 7 to 11: User reviews and approves, authorization is created, Blind Verifier checks, simulated payment executed.
   */
  async executeProtectedPurchase(params: {
    contract: SignedIntentContract;
    selectedOffer: MarketIntelligenceReport['offers'][0];
    userApproved: boolean;
    customTotalAmountPaise?: number; // for testing tamper scenarios
    customPayeeAddress?: string;     // for testing attack scenarios
    customQuantity?: number;         // for testing quantity inflation
  }): Promise<ProtectedModeResult> {
    const { contract, selectedOffer, userApproved } = params;

    const product = await this.repository.getProductById(selectedOffer.productId);
    if (!product) {
      throw new Error(`Product ${selectedOffer.productId} not found`);
    }

    const quantity = params.customQuantity ?? contract.quantity;
    const finalAmountPaise = params.customTotalAmountPaise ?? (selectedOffer.landedPricePaise * quantity);
    const payee = params.customPayeeAddress ?? selectedOffer.payeeAddress;

    // Create purchase authorization
    const authorization: PurchaseAuthorization = {
      contractId: contract.contractId,
      productId: product.id,
      productTitle: product.title,
      brand: product.brand,
      variant: product.variant,
      merchantId: selectedOffer.merchantId,
      merchantName: selectedOffer.merchantName,
      payeeAddress: payee,
      quantity,
      unit: contract.unit,
      itemPricePaise: selectedOffer.basePricePaise * quantity,
      deliveryFeePaise: selectedOffer.deliveryFeePaise,
      platformFeePaise: selectedOffer.handlingFeePaise,
      discountPaise: selectedOffer.discountPaise,
      totalAmountPaise: finalAmountPaise,
      userApproved,
      authorizedAt: new Date().toISOString()
    };

    // Blind Verifier checks the transaction independently
    const verifierDecision = await this.verifier.verify({
      contract,
      authorization,
      merchantPayeeExpected: selectedOffer.payeeAddress
    });

    // Market intelligence report for context
    const marketIntelligence = (await this.repository.getMarketIntelligence(product.id))!;

    let simulatedPaymentResult: ProtectedModeResult['simulatedPaymentResult'];

    if (verifierDecision.decision === 'ALLOW') {
      const txId = `niyat_tx_${Date.now()}`;
      simulatedPaymentResult = {
        txId,
        status: 'PAID',
        amountPaise: finalAmountPaise,
        payeeAddress: payee,
        timestamp: new Date().toISOString()
      };

      await this.repository.recordTransaction({
        mode: 'PROTECTED',
        status: 'ALLOW',
        userRequest: contract.userRequest,
        productId: product.id,
        productTitle: product.title,
        merchantId: selectedOffer.merchantId,
        merchantName: selectedOffer.merchantName,
        payeeAddress: payee,
        quantity,
        itemPricePaise: selectedOffer.basePricePaise * quantity,
        deliveryFeePaise: selectedOffer.deliveryFeePaise,
        handlingFeePaise: selectedOffer.handlingFeePaise,
        discountPaise: selectedOffer.discountPaise,
        totalAmountPaise: finalAmountPaise,
        contractId: contract.contractId,
        verifierDecision: 'ALLOW',
        verifierReasons: verifierDecision.reasons,
        isDemoData: true
      });
    } else {
      simulatedPaymentResult = {
        txId: `niyat_block_${Date.now()}`,
        status: verifierDecision.decision === 'ASK' ? 'CONFIRMATION_REQUIRED' : 'REJECTED',
        amountPaise: finalAmountPaise,
        payeeAddress: payee,
        timestamp: new Date().toISOString()
      };

      await this.repository.recordTransaction({
        mode: 'PROTECTED',
        status: verifierDecision.decision === 'ASK' ? 'ASK' : 'BLOCK',
        userRequest: contract.userRequest,
        productId: product.id,
        productTitle: product.title,
        merchantId: selectedOffer.merchantId,
        merchantName: selectedOffer.merchantName,
        payeeAddress: payee,
        quantity,
        itemPricePaise: selectedOffer.basePricePaise * quantity,
        deliveryFeePaise: selectedOffer.deliveryFeePaise,
        handlingFeePaise: selectedOffer.handlingFeePaise,
        discountPaise: selectedOffer.discountPaise,
        totalAmountPaise: finalAmountPaise,
        contractId: contract.contractId,
        verifierDecision: verifierDecision.decision,
        verifierReasons: verifierDecision.reasons,
        securityExplanation: verifierDecision.securityAlert,
        isDemoData: true
      });
    }

    return {
      step: 'VERIFIED',
      contract,
      marketIntelligence,
      recommendedOffer: selectedOffer,
      authorization,
      verifierDecision,
      simulatedPaymentResult
    };
  }
}
