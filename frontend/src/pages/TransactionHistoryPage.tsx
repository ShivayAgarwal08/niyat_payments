import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { TransactionRecord } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  History,
  Store
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
    <div className="px-4 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF] flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-[#663A91]" />
              Audit Trail
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#766B82] border border-[#E8E2EF]">
              DEMO DATA
            </span>
          </div>
          <h1 className="text-xl font-black text-[#261633] tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs text-[#766B82] leading-relaxed">
            Record of simulated purchases across Normal Mode and NIYAT Protected Mode.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="p-2 rounded-xl bg-white border border-[#E8E2EF] text-[#766B82] hover:text-[#261633] hover:bg-[#F3EDF9] transition shrink-0"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterMode('ALL')}
          className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
            filterMode === 'ALL'
              ? 'bg-[#663A91] text-white shadow-xs'
              : 'bg-white border border-[#E8E2EF] text-[#766B82] hover:bg-[#F3EDF9]'
          }`}
        >
          All ({transactions.length})
        </button>
        <button
          onClick={() => setFilterMode('NORMAL')}
          className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1 shrink-0 ${
            filterMode === 'NORMAL'
              ? 'bg-[#D64C55] text-white shadow-xs'
              : 'bg-white border border-[#E8E2EF] text-[#766B82] hover:bg-[#FBEDED]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Normal (Vulnerable)</span>
        </button>
        <button
          onClick={() => setFilterMode('PROTECTED')}
          className={`text-[11px] px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1 shrink-0 ${
            filterMode === 'PROTECTED'
              ? 'bg-[#168451] text-white shadow-xs'
              : 'bg-white border border-[#E8E2EF] text-[#766B82] hover:bg-[#E8F6EE]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Protected (Safe)</span>
        </button>
      </div>

      {/* Transactions List — Mobile Friendly Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#766B82]">Loading transaction history...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#766B82] bg-white rounded-2xl border border-[#E8E2EF] p-6">
          No simulated transactions recorded for this filter. Run a shopping simulation in Normal Mode or NIYAT Protected Mode to record audit entries.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(tx => (
            <div
              key={tx.id}
              className="niyat-card p-4 space-y-2.5 shadow-card hover:border-[#663A91] transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {tx.mode === 'NORMAL' ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#D64C55] bg-[#FBEDED] px-2 py-0.5 rounded-full border border-[#F7D2D5]">
                      Normal Mode
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#663A91] bg-[#F3EDF9] px-2 py-0.5 rounded-full border border-[#E8E2EF]">
                      Protected Mode
                    </span>
                  )}
                  <span className="text-[10px] text-[#766B82] font-mono">
                    #{tx.id.substring(0, 10)}
                  </span>
                </div>

                <StatusBadge status={tx.status} size="sm" />
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#261633] truncate max-w-[200px]">
                    {tx.productTitle || tx.userRequest}
                  </h3>
                  <span className="text-[11px] text-[#766B82] flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3 text-[#766B82]" />
                    {tx.merchantName}
                  </span>
                </div>

                <div className="text-right">
                  <PriceFormatter paise={tx.totalAmountPaise} className="text-sm font-black text-[#261633]" />
                  <span className="text-[9px] text-[#766B82] block">
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E2EF] text-[10px] text-[#766B82] flex items-center justify-between font-mono">
                <span className="truncate max-w-[180px]">VPA: {tx.payeeAddress}</span>
                <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
