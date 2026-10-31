import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
              <Shield className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-800">NIYAT Payments</span>
            <span>— The Intent Firewall for AI Shopping Agents</span>
          </div>

          {/* Compliance & Educational Disclosure */}
          <div className="text-center md:text-right">
            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200 mr-2">
              DEMO ENVIRONMENT
            </span>
            <span>
              All product prices, merchant listings, and historical observations are synthetic DEMO DATA. Never executes real monetary transactions.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
