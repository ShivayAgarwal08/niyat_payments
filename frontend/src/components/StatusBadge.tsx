import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, TrendingDown, Clock, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'ALLOW' | 'ASK' | 'BLOCK' | 'VULNERABLE' | 'PROTECTED' | 'DEMO_DATA' | 'BUY_NOW' | 'WAIT' | 'REVIEW' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-semibold'
      : 'px-2.5 py-1 text-[11px] font-semibold';

  switch (status.toUpperCase()) {
    case 'ALLOW':
    case 'PROTECTED':
    case 'PAID':
    case 'BUY_NOW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#E8F6EE] text-[#168451] border border-[#C4E8D3] font-semibold tracking-wide ${sizeClasses}`}>
          {status.toUpperCase() === 'BUY_NOW' ? (
            <TrendingDown className="w-3.5 h-3.5 text-[#168451]" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-[#168451]" />
          )}
          <span>{status.toUpperCase() === 'BUY_NOW' ? 'BUY NOW' : 'ALLOW'}</span>
        </span>
      );

    case 'ASK':
    case 'CONFIRMATION_REQUIRED':
    case 'WAIT':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#FDF5E7] text-[#D99A32] border border-[#F5DFB3] font-semibold tracking-wide ${sizeClasses}`}>
          {status.toUpperCase() === 'WAIT' ? (
            <Clock className="w-3.5 h-3.5 text-[#D99A32]" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-[#D99A32]" />
          )}
          <span>{status.toUpperCase() === 'WAIT' ? 'WAIT (PRICE HIGH)' : 'ASK (CONFIRMATION)'}</span>
        </span>
      );

    case 'REVIEW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#F3EDF9] text-[#663A91] border border-[#E8E2EF] font-semibold tracking-wide ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-[#663A91]" />
          <span>REVIEW</span>
        </span>
      );

    case 'BLOCK':
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#FBEDED] text-[#D64C55] border border-[#F7D2D5] font-semibold tracking-wide ${sizeClasses}`}>
          <ShieldX className="w-3.5 h-3.5 text-[#D64C55]" />
          <span>BLOCK</span>
        </span>
      );

    case 'VULNERABLE':
    case 'UNAUTHORIZED_PURCHASE':
    case 'UNAUTHORIZED_SIMULATED_PAYMENT':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#FBEDED] text-[#D64C55] border border-[#F7D2D5] font-semibold tracking-wide ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-[#D64C55]" />
          <span>VULNERABLE (TAMPERED)</span>
        </span>
      );

    case 'DEMO_DATA':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-[#F3EDF9] text-[#766B82] border border-[#E8E2EF] px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase`}>
          DEMO DATA
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-[#F3F1F8] text-[#261633] border border-[#E8E2EF] font-medium ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
