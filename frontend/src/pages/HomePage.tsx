import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { WalletSummary } from '../services/types.js';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Send,
  PlusCircle,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);

  useEffect(() => {
    api.getWallet('user_default')
      .then(setWallet)
      .catch(() => {});
  }, []);

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in pb-16">
      {/* 1. Brand Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            Pocket UPI Architecture
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            v2.5 Production
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          NIYAT Pocket UPI
        </h1>
        <p className="text-xs font-semibold text-slate-700">
          "Your money moves only when the payment matches your intent."
        </p>
      </div>

      {/* 2. Simulated Pocket Wallet Hero Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 shadow-elevated relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-slate-300">Simulated Wallet Balance</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Demo Money
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-3xl font-black tracking-tight">
              ₹{wallet ? wallet.balanceRupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '5,000.00'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {wallet?.wallet.upiId || 'user@niyat'}
            </div>
          </div>
          <Link
            to="/pocket-pay"
            className="text-[11px] text-blue-300 hover:text-white font-semibold flex items-center gap-1 touch-target"
          >
            <span>Manage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pocket Quick Actions */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60">
          <Link
            to="/pocket-pay"
            className="py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition touch-target text-center"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </Link>
          <Link
            to="/pocket-pay"
            className="py-2 px-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition touch-target text-center"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Top Up</span>
          </Link>
          <Link
            to="/pocket-pay"
            className="py-2 px-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition touch-target text-center"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Receive</span>
          </Link>
        </div>
      </div>

      {/* 3. Smart Shopping Shortcut */}
      <div className="card p-4 border border-blue-200 bg-blue-50/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Smart Shopping Shortcut
            </h3>
          </div>
          <span className="text-[10px] font-bold text-blue-700">AI + Blind Verifier</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Ask in English, Hindi or Hinglish (e.g. <em>"2 litre doodh max ₹160"</em>). NIYAT locks your budget and enforces final price parity before wallet transfer.
        </p>
        <Link
          to="/protected-mode"
          className="fintech-btn-primary w-full py-2.5 px-3 text-xs flex items-center justify-center gap-2 shadow-sm touch-target"
        >
          <span>Start Smart Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4. THE TWO PRIMARY SHOPPING MODES (Vulnerable Demonstration vs Protected Firewall) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Shopping Agent Modes
          </h2>
          <span className="text-[11px] text-slate-400">Educational Simulation</span>
        </div>

        {/* OPTION 1: NORMAL SHOPPING (APPEARS FIRST) */}
        <div className="fintech-card p-4 border-rose-200 bg-white space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              1. Vulnerable Demo
            </span>
            <span className="text-[11px] font-semibold text-rose-700">
              No Firewall Check
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              NORMAL SHOPPING
            </h3>
            <p className="text-xs font-medium text-rose-600">
              See what can go wrong without an Intent Firewall.
            </p>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Demonstrates 3 deterministic real-world attacks: Unauthorized Bundles, Accidental Dark-Pattern Subscriptions, and Payee UPI Diversions.
            </p>
          </div>

          <div className="bg-rose-50/60 rounded-xl p-2.5 text-xs space-y-1.5 border border-rose-100">
            <div className="flex items-start gap-2 text-slate-800">
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Agent reads web pages and obeys prompt injections</span>
            </div>
            <div className="flex items-start gap-2 text-slate-800">
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Settles payment without checking user intent constraints</span>
            </div>
          </div>

          <Link
            to="/normal-mode"
            className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm touch-target"
          >
            <span>Launch Normal Mode (Vulnerable)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* OPTION 2: NIYAT PROTECTED (APPEARS SECOND) */}
        <div className="fintech-card p-4 border-slate-300 bg-white space-y-3 relative overflow-hidden ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              2. Protected Firewall
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Active Defense
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              NIYAT PROTECTED
            </h3>
            <p className="text-xs font-medium text-blue-600">
              See how NIYAT protects your intent and wallet.
            </p>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Cryptographically signs your purchase contract, checks historical market fairness, and intercepts payment before any wallet debit occurs.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-200">
            <div className="flex items-start gap-2 text-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">HMAC canonical contract binds Intent $\leftrightarrow$ Merchant $\leftrightarrow$ UPI Payee</span>
            </div>
            <div className="flex items-start gap-2 text-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Deterministic Blind Verifier blocks price spikes & recipient tampering</span>
            </div>
          </div>

          <Link
            to="/protected-mode"
            className="fintech-btn-primary w-full py-2.5 px-3 text-xs flex items-center justify-center gap-2 shadow-sm touch-target"
          >
            <span>Launch NIYAT Protected</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 5. Recent Activity Quick Glance */}
      {wallet?.recentLedgers && wallet.recentLedgers.length > 0 && (
        <div className="card p-4 space-y-2.5 border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recent Transactions
            </h3>
            <Link to="/transactions" className="text-[11px] text-blue-600 font-semibold hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {wallet.recentLedgers.slice(0, 3).map(item => {
              const isCredit = item.targetUpiId === wallet.wallet.upiId;
              const formattedAmt = (item.amountPaise / 100).toFixed(2);
              return (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 truncate max-w-[170px]">{item.note || item.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {isCredit ? '+' : '-'}₹{formattedAmt}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Security Foundation Context */}
      <div className="fintech-card p-4 space-y-3 bg-white">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Security Context
          </span>
          <h3 className="text-sm font-extrabold text-slate-900">
            The Three Vulnerabilities in AI Shopping
          </h3>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">1</span>
              <span>Prompt Injection Vulnerability</span>
            </div>
            <p className="text-slate-600 text-[11px] mt-1">Websites inject hidden prompts that command autonomous shopping agents to buy unwanted items.</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">2</span>
              <span>Delegated Payment Authority</span>
            </div>
            <p className="text-slate-600 text-[11px] mt-1">Giving an AI permission to pay does not ensure it will pay for what you actually requested.</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">3</span>
              <span>Authorization vs. Intent Gap</span>
            </div>
            <p className="text-slate-600 text-[11px] mt-1">A valid digital signature only proves the agent authorized the payment, not that you intended it.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
