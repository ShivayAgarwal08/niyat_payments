import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto advance to Home after 2.5s if user hasn't clicked
      navigate('/home');
    }, 2800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 selection:bg-blue-100">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-elevated transition-transform transform hover:scale-105">
          <Shield className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#172033]">
            NIYAT Payments
          </h1>
          <p className="text-sm font-medium text-blue-600">
            The Intent Firewall for AI Shopping Agents
          </p>
          <p className="text-xs text-slate-500 pt-1 max-w-xs mx-auto">
            Protecting users from malicious instructions hidden in product pages that manipulate autonomous agents into unauthorized purchases.
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="niyat-btn-primary px-6 py-2.5 flex items-center gap-2 text-sm shadow-sm"
          >
            <span>Enter NIYAT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-slate-400">
            SwitchPay-inspired clean fintech security architecture
          </span>
        </div>
      </div>
    </div>
  );
};
