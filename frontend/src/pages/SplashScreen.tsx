import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between items-center px-6 py-12 text-center">
      {/* Top Brand Pill */}
      <div className="pt-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5 text-slate-900" />
          <span>Fintech AI Security</span>
        </div>
      </div>

      {/* Center Hero Logo & Tagline */}
      <div className="space-y-6 max-w-xs">
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md border border-slate-800">
            <Shield className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            NIYAT
          </h1>
          <p className="text-sm font-semibold text-slate-700">
            The Intent Firewall for AI Shopping Agents
          </p>
          <p className="text-xs text-slate-500 leading-relaxed pt-1">
            "Your AI can shop for you. But should it decide what you pay for?"
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-left text-xs shadow-subtle">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-800 font-medium">Signed Intent Contract</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-left text-xs shadow-subtle">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-800 font-medium">Pre-Payment Market Intelligence</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-left text-xs shadow-subtle">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-800 font-medium">Deterministic Blind Verifier</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="w-full max-w-xs space-y-3 pb-6">
        <button
          onClick={() => navigate('/home')}
          className="fintech-btn-primary w-full py-3.5 px-6 text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] touch-target"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
          NIYAT Payments • Hackathon Demo
        </p>
      </div>
    </div>
  );
};
