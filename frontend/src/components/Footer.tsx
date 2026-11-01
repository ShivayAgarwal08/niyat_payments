import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-5 px-4">
      <div className="max-w-md mx-auto space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center text-white">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-xs text-slate-900">NIYAT Payments</span>
          <span className="text-xs text-slate-500">— Intent Firewall for AI Shopping</span>
        </div>

        <p className="text-[11px] text-slate-500">
          Simulated Demonstration Environment • No Real Funds Transferred
        </p>
      </div>
    </footer>
  );
};
