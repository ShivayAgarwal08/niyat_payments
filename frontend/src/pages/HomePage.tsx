import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FlaskConical,
  ShoppingBag,
  History
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* 1. Header & Primary Value Proposition */}
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            AI Intent Firewall
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            NIYAT Payments
          </h1>
          <p className="text-sm font-semibold text-slate-700">
            The Intent Firewall for AI Shopping Agents.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-card">
          <p className="text-sm font-medium text-slate-900 leading-snug">
            "Your AI can shop for you. But should it decide what you pay for?"
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            NIYAT checks whether an AI shopping agent's purchase actually matches what you authorised.
          </p>
        </div>
      </div>

      {/* 2. THE TWO PRIMARY OPTIONS (IN EXACT ORDER: 1. NORMAL -> 2. PROTECTED) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Choose Shopping Mode
          </h2>
          <p className="text-xs text-slate-700 font-medium">
            Experience the vulnerability, then see how NIYAT secures it.
          </p>
        </div>

        {/* OPTION 1: NORMAL SHOPPING (APPEARS FIRST) */}
        <div className="fintech-card p-5 border-rose-200 bg-white space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              1. Vulnerable Demonstration
            </span>
            <span className="text-[11px] font-semibold text-rose-700">
              No Intent Check
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              NORMAL SHOPPING
            </h3>
            <p className="text-xs font-medium text-rose-600 mt-0.5">
              See what can go wrong.
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              An intentionally vulnerable demonstration of an AI shopping agent that can be manipulated by malicious product-page instructions.
            </p>
          </div>

          <div className="bg-rose-50/60 rounded-xl p-3 text-xs space-y-2 border border-rose-100">
            <div className="flex items-start gap-2 text-slate-800">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Agent reads raw web page content and follows hidden prompt injections</span>
            </div>
            <div className="flex items-start gap-2 text-slate-800">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Can trigger unauthorized purchases, accidental subscriptions, or diverted payments</span>
            </div>
          </div>

          <Link
            to="/normal-mode"
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.98] touch-target"
          >
            <span>Launch Normal Shopping (Vulnerable)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* OPTION 2: NIYAT PROTECTED (APPEARS SECOND) */}
        <div className="fintech-card p-5 border-slate-300 bg-white space-y-4 relative overflow-hidden ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              2. Protected Workflow
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Firewall Active
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              NIYAT PROTECTED
            </h3>
            <p className="text-xs font-medium text-blue-600 mt-0.5">
              See how NIYAT protects your intent.
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              A protected shopping workflow that checks purchase details and requires appropriate user authorization.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 border border-slate-200">
            <div className="flex items-start gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Converts request into a cryptographically signed intent agreement</span>
            </div>
            <div className="flex items-start gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Market Intelligence checks fair prices & requires advisory consent</span>
            </div>
            <div className="flex items-start gap-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Independent Blind Verifier makes deterministic ALLOW, ASK, or BLOCK decision</span>
            </div>
          </div>

          <Link
            to="/protected-mode"
            className="fintech-btn-primary w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] touch-target"
          >
            <span>Launch NIYAT Protected</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 3. THE REAL SECURITY PROBLEM (Section 5 Requirement) */}
      <div className="fintech-card p-5 space-y-4 bg-white">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Security Context
          </span>
          <h3 className="text-sm font-extrabold text-slate-900">
            The Three Vulnerabilities in AI Shopping
          </h3>
        </div>

        <div className="space-y-3">
          {/* Problem A */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                A
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                AI agents can be manipulated through prompt injection
              </h4>
            </div>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              A website can contain hidden instructions that manipulate an AI agent reading that website. Security researchers have demonstrated attacks against autonomous agents, including shopping-agent scenarios.
            </p>
          </div>

          {/* Problem B */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                B
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                AI agents are beginning to receive payment authority
              </h4>
            </div>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              Companies are developing systems that let AI agents make purchases and payments with delegated authorization.
            </p>
          </div>

          {/* Problem C */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                C
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                Payment authorization does not establish user intent
              </h4>
            </div>
            <p className="text-xs text-slate-600 pl-7 leading-relaxed">
              A legitimate AI agent can be tricked. Its identity can remain valid, and it can use a correctly signed authorization while performing an action the user never wanted.
            </p>
          </div>
        </div>

        {/* Security Gap Callout */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            The NIYAT Solution
          </span>
          <p className="text-xs font-semibold text-slate-900 leading-snug">
            "NIYAT checks whether the action an AI agent is about to perform still matches what the user actually intended."
          </p>
        </div>
      </div>

      {/* 4. Secondary Navigation (Clean, minimal links) */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
          Explore System Features
        </span>

        <div className="grid grid-cols-1 gap-2">
          <Link
            to="/catalog"
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition flex items-center justify-between touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Shared Catalog</h4>
                <p className="text-[11px] text-slate-500">Inspect synthetic products and hidden prompts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/security-lab"
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition flex items-center justify-between touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Security Sandbox</h4>
                <p className="text-[11px] text-slate-500">Run 10 adversarial attacks against the Blind Verifier</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/transactions"
            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition flex items-center justify-between touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Audit Trail</h4>
                <p className="text-[11px] text-slate-500">View simulated purchase history and audit log</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
