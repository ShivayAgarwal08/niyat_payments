import axios from 'axios';
import {
  ProductItem,
  MarketIntelligenceReport,
  SignedIntentContract,
  NormalSimulationResult,
  SecurityScenario,
  SecurityRunResult,
  TransactionRecord,
  AIProviderStatus,
  WalletSummary
} from './types.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://niyat-payments-api.onrender.com';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Products
  getProducts: async (category?: string, search?: string): Promise<ProductItem[]> => {
    const res = await apiClient.get('/products', {
      params: { category, search }
    });
    return res.data.products;
  },

  getProductById: async (id: string): Promise<ProductItem> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data.product;
  },

  // Market Intelligence
  getMarketIntelligence: async (productId: string): Promise<MarketIntelligenceReport> => {
    const res = await apiClient.get(`/market/${productId}`);
    return res.data.report;
  },

  // Intent parsing
  parseIntent: async (prompt: string) => {
    const res = await apiClient.post('/intent/parse', { prompt });
    return res.data;
  },

  // Create contract
  createContract: async (userRequest: string, intent: any, ttlMinutes?: number): Promise<SignedIntentContract> => {
    const res = await apiClient.post('/intent/create', { userRequest, intent, ttlMinutes });
    return res.data.contract;
  },

  // Normal Shopping Mode Simulation (Part 1)
  simulateNormal: async (prompt: string, scenario?: string): Promise<NormalSimulationResult> => {
    const res = await apiClient.post('/simulation/normal', { prompt, scenario });
    return res.data.simulation;
  },

  // NIYAT Protected Mode (Part 2)
  prepareProtected: async (prompt: string) => {
    const res = await apiClient.post('/simulation/protected/prepare', { prompt });
    return res.data;
  },

  executeProtected: async (payload: {
    contract: SignedIntentContract;
    selectedOffer: any;
    assessmentId: string;
    userApproved: boolean;
    userAcknowledgedAdvisory?: boolean;
    customTotalAmountPaise?: number;
    customPayeeAddress?: string;
    customQuantity?: number;
  }) => {
    const res = await apiClient.post('/simulation/protected/execute', payload);
    return res.data;
  },

  // Transactions
  getTransactions: async (limit = 50): Promise<TransactionRecord[]> => {
    const res = await apiClient.get('/transactions', { params: { limit } });
    return res.data.transactions;
  },

  // Security Lab
  getSecurityScenarios: async (): Promise<SecurityScenario[]> => {
    const res = await apiClient.get('/security/scenarios');
    return res.data.scenarios;
  },

  runSecurityScenario: async (scenarioId: string, customPrompt?: string): Promise<SecurityRunResult> => {
    const res = await apiClient.post('/security/run', { scenarioId, customPrompt });
    return res.data.result;
  },

  // AI Provider Status
  getAIStatus: async (): Promise<AIProviderStatus[]> => {
    const res = await apiClient.get('/ai/status');
    return res.data.providers;
  },

  // Pocket UPI Simulated Wallet
  getWallet: async (ownerId = 'user_default'): Promise<WalletSummary> => {
    const res = await apiClient.get('/wallet', { params: { ownerId } });
    return res.data;
  },

  topUpWallet: async (amountPaise: number, ownerId = 'user_default'): Promise<WalletSummary> => {
    const res = await apiClient.post('/wallet/topup', { amountPaise, ownerId });
    return res.data;
  },

  transferP2P: async (payload: {
    recipientUpiId: string;
    amountPaise: number;
    note?: string;
  }): Promise<{ success: boolean; transactionRef: string; message: string; balanceRupees: number }> => {
    const res = await apiClient.post('/wallet/transfer', payload);
    return res.data;
  }
};
