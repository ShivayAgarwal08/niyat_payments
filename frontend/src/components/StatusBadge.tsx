import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle, TrendingDown, Clock, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'ALLOW' | 'ASK' | 'BLOCK' | 'VULNERABLE' | 'PROTECTED' | 'DEMO_DATA' | 'BUY_NOW' | 'WAIT' | 'REVIEW' | 'NOT ENOUGH DATA' | 'INSUFFICIENT_DATA' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-semibold'
      : 'px-2.5 py-1 text-[11px] font-semibold';

  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'ALLOW':
    case 'PROTECTED':
    case 'PAID':
    case 'BUY_NOW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold tracking-wide ${sizeClasses}`}>
          {normalized === 'BUY_NOW' ? (
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>{normalized === 'BUY_NOW' ? 'BUY NOW' : 'ALLOW'}</span>
        </span>
      );

    case 'ASK':
    case 'CONFIRMATION_REQUIRED':
    case 'WAIT':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold tracking-wide ${sizeClasses}`}>
          {normalized === 'WAIT' ? (
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>{normalized === 'WAIT' ? 'WAIT — HIGH PRICE' : 'ASK — CONFIRM'}</span>
        </span>
      );

    case 'REVIEW':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-semibold tracking-wide ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>REVIEW NEEDED</span>
        </span>
      );

    case 'BLOCK':
    case 'REJECTED':
    case 'VULNERABLE':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-semibold tracking-wide ${sizeClasses}`}>
          {normalized === 'VULNERABLE' ? (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <ShieldX className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span>{normalized === 'VULNERABLE' ? 'VULNERABLE' : 'BLOCK'}</span>
        </span>
      );

    case 'INSUFFICIENT_DATA':
    case 'NOT ENOUGH DATA':
    case 'DATA_UNAVAILABLE':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-semibold tracking-wide ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>NOT ENOUGH DATA</span>
        </span>
      );

    case 'DEMO_DATA':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium tracking-wide ${sizeClasses}`}>
          <span>DEMO DATA</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-medium ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};
