import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ShieldAlert, ArrowRight, CheckCircle2, XCircle, Sparkles, Lock, Cpu, ShoppingBag } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Agent Security Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
          The Intent Firewall for AI Shopping Agents
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          When autonomous AI shopping agents browse e-commerce websites, untrusted product pages can contain
          hidden instructions (prompt injections) that trick the agent into paying arbitrary amounts to attacker accounts.
          NIYAT eliminates this threat with cryptographically signed intent contracts and deterministic blind verification.
        </p>
      </div>

      {/* THE TWO PRIMARY SHOPPING MODES (IN FIXED EXACT ORDER) */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-[#172033]">
            Experience The Two Shopping Modes
          </h2>
          <p className="text-xs text-slate-500">
            Compare an ordinary AI shopping agent with an agent guarded by NIYAT
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PART 1 — FIRST: Normal Shopping Mode (Vulnerable) */}
          <div className="niyat-card p-6 border-rose-200 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Part 1 — Experience First
                </span>
                <span className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" />
                  Unprotected
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#172033]">
                  1. Normal Shopping Mode
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ordinary AI shopping agent without NIYAT protection.
                </p>
              </div>

              <p className="text-sm text-slate-600">
                Demonstrates how a standard shopping agent ingests malicious prompt injections hidden inside
                product descriptions, causing it to divert payments, inflate order quantities, or subscribe to unauthorized fees.
              </p>

              <div className="bg-rose-50/50 rounded-lg p-3 text-xs space-y-2 border border-rose-100">
                <div className="flex items-center gap-2 text-rose-800 font-medium">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Agent ingests untrusted HTML & product descriptions</span>
                </div>
                <div className="flex items-center gap-2 text-rose-800 font-medium">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Autonomous payment execution with zero intent boundary</span>
                </div>
                <div className="flex items-center gap-2 text-rose-800 font-medium">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Vulnerable to payee diversion and cart inflation</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/normal-mode"
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition shadow-sm"
              >
                <span>Launch Part 1: Normal Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* PART 2 — SECOND: NIYAT Protected Mode (Secure) */}
          <div className="niyat-card p-6 border-blue-300 relative overflow-hidden flex flex-col justify-between ring-1 ring-blue-500/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Part 2 — The Solution
                </span>
                <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Intent Firewall
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#172033]">
                  2. NIYAT Protected Mode
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cryptographically signed intent with deterministic Blind Verifier.
                </p>
              </div>

              <p className="text-sm text-slate-600">
                Features integrated Market Intelligence to analyze landed prices and SKU offers. The Blind Verifier
                evaluates the purchase authorization strictly against the signed intent contract without ever seeing raw product page HTML.
              </p>

              <div className="bg-blue-50/50 rounded-lg p-3 text-xs space-y-2 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Intent extraction signed with cryptographic nonce</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Integrated Market Intelligence inside Protected Mode</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Deterministic Blind Verifier decides ALLOW / ASK / BLOCK</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                to="/protected-mode"
                className="niyat-btn-primary w-full py-2.5 px-4 text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Launch Part 2: NIYAT Protected Mode</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How NIYAT Works: Architecture Pipeline */}
      <div className="niyat-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[#172033]">
            NIYAT Core Security Architecture
          </h2>
          <p className="text-xs text-slate-500">
            AI recommendations are decoupled from payment authorization
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">User Intent</h4>
            <p className="text-xs text-slate-500">
              User specifies product, brand, quantity, and budget ceiling.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">Signed Contract</h4>
            <p className="text-xs text-slate-500">
              HMAC-SHA256 signature with single-use nonce & expiry time.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">Market Intelligence</h4>
            <p className="text-xs text-slate-500">
              Calculates landed prices across verified merchants and historical trend.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              4
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">User Approval</h4>
            <p className="text-xs text-slate-500">
              User reviews selected offer before creating purchase authorization.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              5
            </div>
            <h4 className="text-sm font-semibold text-[#172033]">Blind Verifier</h4>
            <p className="text-xs text-slate-500">
              Deterministic 12-point rule engine outputs ALLOW, ASK, or BLOCK.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access to Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/catalog"
          className="niyat-card p-5 hover:border-slate-300 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              Shared Catalog
            </span>
            <h4 className="text-sm font-bold text-[#172033]">Browse Marketplace</h4>
            <p className="text-xs text-slate-500">Explore demo products across 5 categories.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
        </Link>

        <Link
          to="/security-lab"
          className="niyat-card p-5 hover:border-slate-300 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              10 Attack Vectors
            </span>
            <h4 className="text-sm font-bold text-[#172033]">Open Security Lab</h4>
            <p className="text-xs text-slate-500">Execute real adversarial tests on the verifier.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
        </Link>

        <Link
          to="/settings"
          className="niyat-card p-5 hover:border-slate-300 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Resilient AI Stack
            </span>
            <h4 className="text-sm font-bold text-[#172033]">AI Provider Status</h4>
            <p className="text-xs text-slate-500">Gemini, Groq, OpenRouter & Local Fallback.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
        </Link>
      </div>
    </div>
  );
};
