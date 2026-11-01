import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { SecurityScenario, SecurityRunResult } from '../services/types.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  FlaskConical,
  Play,
  RefreshCw
} from 'lucide-react';

export const SecurityLabPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<SecurityScenario[]>([]);
  const [results, setResults] = useState<Record<string, SecurityRunResult>>({});
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const list = await api.getSecurityScenarios();
        setScenarios(list);
        if (list.length > 0) setActiveTab(list[0].id);
      } catch (err) {
        console.error('Failed to fetch security scenarios:', err);
      }
    };
    fetchScenarios();
  }, []);

  const handleRunScenario = async (scenarioId: string) => {
    if (runningId !== null || runningAll) return;
    setRunningId(scenarioId);
    try {
      const res = await api.runSecurityScenario(scenarioId);
      setResults(prev => ({ ...prev, [scenarioId]: res }));
    } catch (err) {
      console.error(`Failed to run scenario ${scenarioId}:`, err);
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    if (runningAll || runningId !== null) return;
    setRunningAll(true);
    for (const sc of scenarios) {
      try {
        const res = await api.runSecurityScenario(sc.id);
        setResults(prev => ({ ...prev, [sc.id]: res }));
      } catch (err) {
        console.error(`Error in ${sc.id}:`, err);
      }
    }
    setRunningAll(false);
  };

  const activeScenario = scenarios.find(s => s.id === activeTab);
  const activeResult = activeTab ? results[activeTab] : null;

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
            NIYAT Wall Security Lab
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            10 Attack Vectors
          </span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Adversarial Attack & Security Lab
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Executes real adversarial attacks against the NIYAT Wall and Blind Verifier to prove zero bypasses across price manipulation, payee diversion, product hijacking, and replay attacks.
        </p>
      </div>

      {/* Global Run All Button */}
      <button
        onClick={handleRunAll}
        disabled={runningAll || runningId !== null}
        className="fintech-btn-primary w-full py-3.5 px-4 text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.98] touch-target"
      >
        {runningAll ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Executing All 10 Adversarial Vectors...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 font-bold">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run All 10 Adversarial Tests</span>
          </span>
        )}
      </button>

      {/* Scenario Horizontal Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {scenarios.map(sc => {
          const res = results[sc.id];
          const isSelected = activeTab === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setActiveTab(sc.id)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition shrink-0 flex items-center gap-1.5 touch-target ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{sc.name}</span>
              {res && (
                <span className={`w-2 h-2 rounded-full ${res.blocked ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Scenario Detail Card */}
      {activeScenario && (
        <div className="fintech-card p-5 space-y-4 bg-white">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vector: {activeScenario.category}
              </span>
              <h3 className="font-bold text-sm text-slate-900">
                {activeScenario.name}
              </h3>
            </div>

            {activeResult && (
              <StatusBadge status={activeResult.verifierDecision} size="sm" />
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {activeScenario.description}
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Default Test Request:
            </span>
            <p className="text-slate-800 font-medium">"{activeScenario.defaultPrompt}"</p>
          </div>

          <button
            onClick={() => handleRunScenario(activeScenario.id)}
            disabled={runningId === activeScenario.id || runningAll}
            className="fintech-btn-accent w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.98] touch-target"
          >
            {runningId === activeScenario.id ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Attack Vector...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 font-bold">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute This Attack</span>
              </span>
            )}
          </button>

          {/* Test Result Breakdown */}
          {activeResult && (
            <div className={`p-4 rounded-xl border space-y-2 text-xs ${
              activeResult.blocked
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">
                  {activeResult.blocked ? 'ATTACK BLOCKED BY BLIND VERIFIER' : 'UNEXPECTED BYPASS'}
                </span>
                <span className="text-[10px] font-mono">{activeResult.verifierDecision}</span>
              </div>
              <p className="leading-snug">
                {activeResult.reason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
