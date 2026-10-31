import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'ALLOW' | 'ASK' | 'BLOCK' | 'VULNERABLE' | 'PROTECTED' | 'DEMO_DATA' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  switch (status.toUpperCase()) {
    case 'ALLOW':
    case 'PROTECTED':
    case 'PAID':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ALLOW</span>
        </span>
      );

    case 'ASK':
    case 'CONFIRMATION_REQUIRED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>ASK (Confirmation Required)</span>
        </span>
      );

    case 'BLOCK':
    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <ShieldX className="w-3.5 h-3.5 text-rose-600" />
          <span>BLOCK</span>
        </span>
      );

    case 'VULNERABLE':
    case 'UNAUTHORIZED_PURCHASE':
    case 'UNAUTHORIZED_SIMULATED_PAYMENT':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>VULNERABLE (Tampered)</span>
        </span>
      );

    case 'DEMO_DATA':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase`}>
          Demo Data
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};
