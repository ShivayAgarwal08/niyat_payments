import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#E8E2EF] bg-white py-6 px-4">
      <div className="max-w-md mx-auto space-y-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#663A91] flex items-center justify-center text-white">
            <Shield className="w-3 h-3" />
          </div>
          <span className="font-bold text-xs text-[#261633]">NIYAT Payments</span>
          <span className="text-xs text-[#766B82]">— Intent Firewall</span>
        </div>

        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span className="inline-block px-2 py-0.5 rounded-full bg-[#F3EDF9] text-[#663A91] font-bold text-[10px] border border-[#E8E2EF] tracking-wider uppercase">
            DEMO ENVIRONMENT
          </span>
          <span className="text-[11px] text-[#766B82]">
            Simulated transactions only • Never executes real fund transfers.
          </span>
        </div>
      </div>
    </footer>
  );
};
