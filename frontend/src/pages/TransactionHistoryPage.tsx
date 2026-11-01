import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { TransactionRecord } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  History,
  RefreshCw,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export const TransactionHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'NORMAL' | 'PROTECTED'>('ALL');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions(50);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => {
    if (filterMode === 'ALL') return true;
    return t.mode === filterMode;
  });

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-blue-600" />
              Orders & Wall History
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
              SIMULATED
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Orders & Payment History
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Immutable audit record of shopping orders intercepted and verified by the NIYAT Wall.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shrink-0 touch-target flex items-center justify-center"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterMode('ALL')}
          className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition shrink-0 touch-target ${
            filterMode === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Activity ({transactions.length})
        </button>
        <button
          onClick={() => setFilterMode('NORMAL')}
          className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition shrink-0 touch-target flex items-center gap-1.5 ${
            filterMode === 'NORMAL'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Normal (Vulnerable)
        </button>
        <button
          onClick={() => setFilterMode('PROTECTED')}
          className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition shrink-0 touch-target flex items-center gap-1.5 ${
            filterMode === 'PROTECTED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          NIYAT Protected
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-2.5">
        {loading && transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
            <span>Loading simulated audit trail...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            No transactions found in this view.
          </div>
        ) : (
          filtered.map(tx => (
            <div
              key={tx.id}
              className={`p-4 rounded-2xl border bg-white space-y-2.5 transition shadow-subtle ${
                tx.mode === 'PROTECTED' ? 'border-slate-200 hover:border-blue-300' : 'border-rose-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tx.mode === 'PROTECTED' ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      PROTECTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      NORMAL
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                    {tx.productTitle}
                  </span>
                </div>

                <StatusBadge status={tx.status} size="sm" />
              </div>

              <div className="text-xs space-y-1">
                <p className="text-slate-600 line-clamp-1">
                  <span className="font-semibold text-slate-900">Request: </span>
                  "{tx.userRequest}"
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                  <span>Merchant: <strong className="text-slate-900">{tx.merchantName}</strong></span>
                  <span className="font-bold text-slate-900">
                    <PriceFormatter paise={tx.totalAmountPaise} />
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="font-mono">{tx.payeeAddress}</span>
                  <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {tx.securityExplanation && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-snug">
                  {tx.securityExplanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
