import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { TransactionRecord } from '../services/types.js';
import { PriceFormatter } from '../components/PriceFormatter.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Shield, ShieldAlert, RefreshCw } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
              Transaction Audit Trail
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-semibold">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of simulated transactions across both Normal Shopping Mode and NIYAT Protected Mode.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="niyat-btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterMode('ALL')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
            filterMode === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setFilterMode('NORMAL')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
            filterMode === 'NORMAL'
              ? 'bg-rose-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Normal Mode (Vulnerable)
        </button>
        <button
          onClick={() => setFilterMode('PROTECTED')}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
            filterMode === 'PROTECTED'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          NIYAT Protected Mode
        </button>
      </div>

      {/* Transactions Table */}
      <div className="niyat-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit log...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No transactions found for this filter. Run either Normal Mode or NIYAT Protected Mode to generate audit records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">User Request</th>
                  <th className="py-3 px-4">Product / Merchant</th>
                  <th className="py-3 px-4">Payee VPA</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Verifier Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      {tx.mode === 'NORMAL' ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          NORMAL
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          PROTECTED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                      "{tx.userRequest}"
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold text-[#172033]">{tx.productTitle}</div>
                      <div className="text-[11px] text-slate-400">{tx.merchantName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {tx.payeeAddress}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriceFormatter paise={tx.totalAmountPaise} className="text-slate-900 font-bold" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
