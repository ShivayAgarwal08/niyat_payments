import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Cpu,
  ShoppingBag,
  FlaskConical,
  History
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="px-4 py-5 space-y-6">
      {/* Hero Emphasis Card — Deep Plum Fintech Panel */}
      <div className="niyat-card-plum p-6 relative overflow-hidden space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#F3EDF9]" />
          <span>Intent Firewall</span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
            The Intent Firewall for AI Shopping Agents
          </h1>
          <p className="text-xs text-[#E8E2EF]/80 leading-relaxed">
            When autonomous AI agents buy on the web, untrusted product descriptions can contain prompt injections that divert payments or inflate orders. NIYAT eliminates this threat with cryptographic intent binding and deterministic blind verification.
          </p>
        </div>

        {/* Quick Architecture Pills */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#E8E2EF]/60">AI Stack</span>
            <span className="text-xs font-semibold text-white">4-Tier Fallback</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#E8E2EF]/60">Checkpoint</span>
            <span className="text-xs font-semibold text-white">Market Intel</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#E8E2EF]/60">Verifier</span>
            <span className="text-xs font-semibold text-white">Deterministic</span>
          </div>
        </div>
      </div>

      {/* THE TWO PRIMARY SHOPPING MODES (IN EXACT ORDER: 1. NORMAL -> 2. PROTECTED) */}
      <div className="space-y-3">
        <div className="px-1 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#766B82]">
              Shopping Experiences
            </h2>
            <p className="text-xs font-semibold text-[#261633]">
              Compare Unprotected vs NIYAT Protected Agent
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91]">
            2 Modes
          </span>
        </div>

        {/* MODE 1: Normal Shopping Mode (Vulnerable) — APPEARS FIRST */}
        <div className="niyat-card p-5 border-[#F7D2D5] bg-white relative overflow-hidden space-y-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FBEDED] text-[#D64C55] border border-[#F7D2D5]">
              Part 1 — Experience First
            </span>
            <span className="text-xs font-semibold text-[#D64C55] flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-[#D64C55]" />
              Vulnerable
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#261633]">
              1. Normal Shopping Mode
            </h3>
            <p className="text-xs text-[#766B82] mt-0.5">
              Standard autonomous shopping agent without intent firewall protection.
            </p>
          </div>

          <div className="bg-[#FBEDED]/50 rounded-xl p-3 text-xs space-y-1.5 border border-[#F7D2D5]/70">
            <div className="flex items-start gap-2 text-[#261633]">
              <XCircle className="w-4 h-4 text-[#D64C55] shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Ingests untrusted HTML & product descriptions without intent boundaries</span>
            </div>
            <div className="flex items-start gap-2 text-[#261633]">
              <XCircle className="w-4 h-4 text-[#D64C55] shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Autonomous payment execution susceptible to prompt injection hijack</span>
            </div>
          </div>

          <Link
            to="/normal-mode"
            className="w-full py-3 px-4 rounded-xl bg-[#D64C55] hover:bg-[#C03942] text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.98]"
          >
            <span>Launch Part 1: Normal Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* MODE 2: NIYAT Protected Mode (Secure) — APPEARS SECOND */}
        <div className="niyat-card p-5 border-[#E8E2EF] bg-white relative overflow-hidden space-y-4 shadow-card ring-1 ring-[#663A91]/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF]">
              Part 2 — The Solution
            </span>
            <span className="text-xs font-semibold text-[#663A91] flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#663A91]" />
              Intent Protected
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#261633]">
              2. NIYAT Protected Mode
            </h3>
            <p className="text-xs text-[#766B82] mt-0.5">
              Cryptographically signed intent contract + mandatory Market Intelligence.
            </p>
          </div>

          <div className="bg-[#F3EDF9]/60 rounded-xl p-3 text-xs space-y-1.5 border border-[#E8E2EF]">
            <div className="flex items-start gap-2 text-[#261633]">
              <CheckCircle2 className="w-4 h-4 text-[#168451] shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Signed Intent Contract with cryptographic nonce & budget ceiling</span>
            </div>
            <div className="flex items-start gap-2 text-[#261633]">
              <CheckCircle2 className="w-4 h-4 text-[#168451] shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Mandatory pre-payment Market Intelligence & unit price check</span>
            </div>
            <div className="flex items-start gap-2 text-[#261633]">
              <CheckCircle2 className="w-4 h-4 text-[#168451] shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">Deterministic Blind Verifier decides ALLOW, ASK, or BLOCK</span>
            </div>
          </div>

          <Link
            to="/protected-mode"
            className="niyat-btn-primary w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
          >
            <span>Launch Part 2: NIYAT Protected Mode</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 5-Step Security Flow — Visual Timeline */}
      <div className="niyat-card p-5 space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
            Protection Architecture
          </span>
          <h3 className="text-sm font-extrabold text-[#261633]">
            How NIYAT Protects AI Purchases
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
            <div className="w-7 h-7 rounded-lg bg-[#663A91] text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#261633]">Structured Intent Parsing</h4>
              <p className="text-[11px] text-[#766B82]">4-tier resilient AI fallback converts request to structured purchase bounds.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
            <div className="w-7 h-7 rounded-lg bg-[#663A91] text-white flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#261633]">Signed Intent Contract</h4>
              <p className="text-[11px] text-[#766B82]">Cryptographic HMAC-SHA256 signature locks budget, brand & nonce.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
            <div className="w-7 h-7 rounded-lg bg-[#663A91] text-white flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#261633]">Mandatory Market Intelligence</h4>
              <p className="text-[11px] text-[#766B82]">Calculates landed price across merchants & checks unit pricing vs history.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
            <div className="w-7 h-7 rounded-lg bg-[#663A91] text-white flex items-center justify-center text-xs font-bold shrink-0">
              4
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#261633]">Explicit User Approval</h4>
              <p className="text-[11px] text-[#766B82]">User reviews selected offer and signs off on any market advisory.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
            <div className="w-7 h-7 rounded-lg bg-[#168451] text-white flex items-center justify-center text-xs font-bold shrink-0">
              5
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#261633]">Deterministic Blind Verifier</h4>
              <p className="text-[11px] text-[#766B82]">12-rule mathematical check verifies contract integrity before payment.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] px-1">
          Explore Platform Modules
        </span>

        <div className="grid grid-cols-1 gap-2.5">
          <Link
            to="/catalog"
            className="niyat-card p-3.5 hover:border-[#663A91] transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F3EDF9] flex items-center justify-center text-[#663A91]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#261633]">Shared Marketplace</h4>
                <p className="text-[11px] text-[#766B82]">Browse items & view hidden prompt injection payloads</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#766B82] group-hover:text-[#663A91] transition" />
          </Link>

          <Link
            to="/security-lab"
            className="niyat-card p-3.5 hover:border-[#663A91] transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FDF5E7] flex items-center justify-center text-[#D99A32]">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#261633]">Security Lab (10 Attacks)</h4>
                <p className="text-[11px] text-[#766B82]">Run live adversarial tests against the Blind Verifier</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#766B82] group-hover:text-[#663A91] transition" />
          </Link>

          <Link
            to="/transactions"
            className="niyat-card p-3.5 hover:border-[#663A91] transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E8F6EE] flex items-center justify-center text-[#168451]">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#261633]">Transaction Audit Trail</h4>
                <p className="text-[11px] text-[#766B82]">Inspect all simulated payments and cryptographic hashes</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#766B82] group-hover:text-[#663A91] transition" />
          </Link>

          <Link
            to="/settings"
            className="niyat-card p-3.5 hover:border-[#663A91] transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F3EDF9] flex items-center justify-center text-[#663A91]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#261633]">AI Provider Stack Status</h4>
                <p className="text-[11px] text-[#766B82]">Gemini, Groq, OpenRouter & Local Fallback</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#766B82] group-hover:text-[#663A91] transition" />
          </Link>
        </div>
      </div>
    </div>
  );
};
