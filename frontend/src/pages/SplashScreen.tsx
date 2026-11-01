import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Sparkles, Lock, Cpu } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F3F1F8] flex flex-col justify-between items-center px-6 py-12 text-center">
      {/* Top Brand Pill */}
      <div className="pt-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EDF9] border border-[#E8E2EF] text-[#663A91] text-[11px] font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#663A91]" />
          <span>Fintech AI Agent Security</span>
        </div>
      </div>

      {/* Center Hero Logo & Tagline */}
      <div className="space-y-6 max-w-xs">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-[#663A91]/20 rounded-3xl blur-xl" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#351B4D] via-[#482568] to-[#663A91] flex items-center justify-center text-white shadow-plum border border-white/20 transition-transform transform hover:scale-105">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-[#261633]">
            NIYAT
          </h1>
          <p className="text-sm font-semibold text-[#663A91]">
            The Intent Firewall for AI Shopping Agents
          </p>
          <p className="text-xs text-[#766B82] leading-relaxed pt-1">
            Defending users against hidden prompt injections that hijack autonomous shopping agents into unauthorized payments.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="bg-white/80 border border-[#E8E2EF] rounded-xl px-3 py-2 flex items-center gap-2.5 text-left text-xs shadow-subtle">
            <Lock className="w-4 h-4 text-[#663A91] shrink-0" />
            <span className="text-[#261633] font-medium">Signed Intent Contract</span>
          </div>
          <div className="bg-white/80 border border-[#E8E2EF] rounded-xl px-3 py-2 flex items-center gap-2.5 text-left text-xs shadow-subtle">
            <Sparkles className="w-4 h-4 text-[#663A91] shrink-0" />
            <span className="text-[#261633] font-medium">Pre-Payment Market Intelligence</span>
          </div>
          <div className="bg-white/80 border border-[#E8E2EF] rounded-xl px-3 py-2 flex items-center gap-2.5 text-left text-xs shadow-subtle">
            <Cpu className="w-4 h-4 text-[#663A91] shrink-0" />
            <span className="text-[#261633] font-medium">Deterministic Blind Verifier</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="w-full max-w-xs space-y-3 pb-6">
        <button
          onClick={() => navigate('/home')}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#663A91] hover:bg-[#552F7A] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-card active:scale-[0.98]"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[10px] text-[#766B82] uppercase tracking-wider font-semibold">
          SwitchPay-Inspired Visual Experience
        </p>
      </div>
    </div>
  );
};
