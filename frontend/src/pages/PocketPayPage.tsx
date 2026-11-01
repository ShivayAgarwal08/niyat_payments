import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { WalletSummary } from '../services/types.js';
import {
  Send,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

export const PocketPayPage: React.FC = () => {
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Send Money State
  const [recipientUpi, setRecipientUpi] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [sending, setSending] = useState(false);

  // Top Up State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('1000');
  const [toppingUp, setToppingUp] = useState(false);

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getWallet('user_default');
      setWalletSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to load simulated wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const amt = parseFloat(amountRupees);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid transfer amount');
      return;
    }

    if (!recipientUpi.trim()) {
      setError('Please enter a valid recipient UPI ID');
      return;
    }

    try {
      setSending(true);
      const amountPaise = Math.round(amt * 100);
      const result = await api.transferP2P({
        recipientUpiId: recipientUpi.trim(),
        amountPaise,
        note: paymentNote.trim() || undefined
      });

      setSuccessMsg(result.message);
      setRecipientUpi('');
      setAmountRupees('');
      setPaymentNote('');
      await fetchWallet();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Payment transfer failed');
    } finally {
      setSending(false);
    }
  };

  const handleTopUp = async () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Invalid top-up amount');
      return;
    }

    try {
      setToppingUp(true);
      const amountPaise = Math.round(amt * 100);
      await api.topUpWallet(amountPaise, 'user_default');
      setShowTopUpModal(false);
      setSuccessMsg(`Simulated balance topped up by ₹${amt.toFixed(2)}`);
      await fetchWallet();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to add demo money');
    } finally {
      setToppingUp(false);
    }
  };

  const handleCopyUpi = () => {
    if (walletSummary?.wallet.upiId) {
      navigator.clipboard.writeText(walletSummary.wallet.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const quickRecipients = [
    { name: 'Rahul Sharma', upi: 'rahul@niyat' },
    { name: 'Priya Patel', upi: 'priya@niyat' },
    { name: 'QuickMart Groceries', upi: 'quickmart@upi' },
    { name: 'FreshBazaar Store', upi: 'freshbazaar@upi' }
  ];

  return (
    <div className="p-4 sm:p-5 space-y-5 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Pocket UPI
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
            Simulated Payments
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Fast, zero-risk demo money transfers with instant settlement
          </p>
        </div>
        <button
          onClick={() => setShowQrModal(true)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 touch-target flex items-center justify-center"
          title="Show My UPI QR"
        >
          <QrCode className="w-5 h-5 text-slate-800" />
        </button>
      </div>

      {/* Wallet Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 shadow-elevated relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300">NIYAT Pocket Balance</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Simulated DEMO
          </span>
        </div>

        <div className="mb-4">
          <div className="text-3xl font-black tracking-tight flex items-baseline gap-1">
            <span>₹</span>
            {loading ? (
              <span className="text-xl text-slate-400 animate-pulse">Loading...</span>
            ) : (
              <span>{walletSummary?.balanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-mono">
              {walletSummary?.wallet.upiId || 'user@niyat'}
            </span>
            <button
              onClick={handleCopyUpi}
              className="text-slate-400 hover:text-white transition touch-target"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
          <button
            onClick={() => setShowTopUpModal(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition touch-target"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Demo Money</span>
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition touch-target flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            <span>Receive</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Send Money Form */}
      <div className="card p-4 space-y-4 shadow-subtle border border-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Send className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Send Money (P2P Transfer)</h2>
        </div>

        {/* Quick Contacts */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Contacts
          </label>
          <div className="grid grid-cols-2 gap-2">
            {quickRecipients.map(c => (
              <button
                key={c.upi}
                type="button"
                onClick={() => setRecipientUpi(c.upi)}
                className={`p-2 rounded-xl text-left border transition text-xs touch-target ${
                  recipientUpi === c.upi
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{c.upi}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSendPayment} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Recipient UPI ID
            </label>
            <input
              type="text"
              placeholder="e.g. rahul@niyat or shop@upi"
              value={recipientUpi}
              onChange={e => setRecipientUpi(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono bg-white touch-target"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={amountRupees}
                onChange={e => setAmountRupees(e.target.value)}
                required
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white touch-target"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch split, Grocery recharge"
              value={paymentNote}
              onChange={e => setPaymentNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white touch-target"
            />
          </div>

          <button
            type="submit"
            disabled={sending || loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition touch-target"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing Simulated Settlement...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>Pay From Pocket Balance</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent Activity Mini-Ledger */}
      <div className="card p-4 space-y-3 border border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Wallet Activity</h2>
          <span className="text-[10px] font-semibold text-slate-500 uppercase">
            {walletSummary?.recentLedgers.length || 0} Entries
          </span>
        </div>

        {walletSummary?.recentLedgers && walletSummary.recentLedgers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {walletSummary.recentLedgers.slice(0, 5).map(item => {
              const isCredit = item.targetUpiId === walletSummary.wallet.upiId;
              const formattedAmt = (item.amountPaise / 100).toFixed(2);
              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-[190px]">
                        {item.note || (isCredit ? `Received from ${item.sourceUpiId}` : `Paid to ${item.targetUpiId}`)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.type}
                      </div>
                    </div>
                  </div>

                  <div className={`text-xs font-black ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {isCredit ? '+' : '-'}₹{formattedAmt}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No wallet transfers yet. Add demo money or make a transfer!
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card p-5 max-w-sm w-full space-y-4 shadow-elevated border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Add Demo Money</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold touch-target"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Instantly credit simulated INR demo funds to your testing wallet. No actual bank or payment gateway is involved.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {['500', '1000', '5000'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTopUpAmount(val)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition touch-target ${
                    topUpAmount === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                value={topUpAmount}
                onChange={e => setTopUpAmount(e.target.value)}
                placeholder="Custom Amount"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white touch-target"
              />
            </div>

            <button
              onClick={handleTopUp}
              disabled={toppingUp}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition touch-target"
            >
              {toppingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Adding Funds...</span>
                </>
              ) : (
                <span>Confirm Top-Up (₹{topUpAmount})</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* QR Code Receive Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="card p-5 max-w-sm w-full space-y-4 shadow-elevated border border-slate-200 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Scan to Pay Me</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold touch-target"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              <div className="w-44 h-44 bg-white rounded-xl border border-slate-300 flex flex-col items-center justify-center p-3 relative shadow-sm">
                <QrCode className="w-32 h-32 text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-medium">Your Simulated UPI ID</p>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-mono text-sm font-bold text-slate-900">
                <span>{walletSummary?.wallet.upiId || 'user@niyat'}</span>
                <button
                  onClick={handleCopyUpi}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Other users or simulated agents can send demo money to this identifier.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
