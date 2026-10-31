import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { SecurityScenario, SecurityRunResult } from '../services/types.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { FlaskConical, Play } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
              Live Security Sandbox
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight mt-1">
            NIYAT Security Lab: 10 Adversarial Attack Scenarios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Executes real attacks against the deterministic Blind Verifier to verify that zero attacks bypass the firewall.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={runningAll || runningId !== null}
          className="niyat-btn-primary px-4 py-2 text-xs flex items-center gap-2 self-start sm:self-center disabled:opacity-50"
        >
          {runningAll ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Running All 10 Attacks...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run All 10 Tests</span>
            </span>
          )}
        </button>
      </div>

      {/* Main Scenarios Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: List of 10 Scenarios */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold uppercase text-slate-400 px-1">
            Attack Vectors ({scenarios.length})
          </div>

          <div className="space-y-1.5">
            {scenarios.map((sc, idx) => {
              const res = results[sc.id];
              const isSelected = activeTab === sc.id;
              const isRunning = runningId === sc.id;

              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveTab(sc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      #{idx + 1} • {sc.category}
                    </div>
                    <div className="font-semibold text-xs text-[#172033] truncate">
                      {sc.name}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isRunning ? (
                      <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin inline-block" />
                    ) : res ? (
                      res.blocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          VULNERABLE
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] text-slate-300">Ready</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Area: Active Scenario Inspector */}
        <div className="lg:col-span-8">
          {activeScenario ? (
            <div className="niyat-card p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-blue-600">
                    {activeScenario.category}
                  </span>
                  <h2 className="text-lg font-bold text-[#172033]">
                    {activeScenario.name}
                  </h2>
                </div>

                <button
                  onClick={() => handleRunScenario(activeScenario.id)}
                  disabled={runningId === activeScenario.id}
                  className="niyat-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 self-start sm:self-center disabled:opacity-50"
                >
                  {runningId === activeScenario.id ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Executing Test...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Test</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Scenario Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Attack Description:</span>
                  <p className="text-slate-700 mt-0.5">{activeScenario.description}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-medium">Malicious Attack Vector:</span>
                  <p className="font-mono text-xs text-rose-700 font-semibold mt-0.5">
                    {activeScenario.attackVector}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Baseline Prompt:</span>
                  <p className="font-medium text-slate-800 mt-0.5">"{activeScenario.defaultPrompt}"</p>
                </div>
              </div>

              {/* Live Test Results */}
              {activeResult ? (
                <div className="space-y-4 pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Execution Comparison
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Normal Mode Result */}
                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2">
                      <div className="flex items-center justify-between font-bold text-rose-800">
                        <span>Normal AI Shopping Agent</span>
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px]">
                          VULNERABLE
                        </span>
                      </div>
                      <p className="text-slate-600">
                        {activeResult.normalModeResult.explanation}
                      </p>
                      <div className="text-[11px] text-rose-700 font-medium pt-1">
                        Result: Unauthorized transaction allowed by ordinary shopping agent.
                      </div>
                    </div>

                    {/* NIYAT Protected Result */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                      <div className="flex items-center justify-between font-bold text-emerald-800">
                        <span>NIYAT Intent Firewall</span>
                        <StatusBadge status={activeResult.verifierDecision} size="sm" />
                      </div>
                      <p className="text-slate-700 font-medium">
                        Deterministic Decision: {activeResult.verifierDecision}
                      </p>
                      <div className="text-[11px] text-emerald-800 pt-1">
                        <span className="font-semibold">Firewall Reason: </span>
                        {activeResult.reason}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono">
                    <span className="text-emerald-400 font-semibold">Verification Audit Status: </span>
                    {activeResult.blocked ? 'ATTACK DEFLECTED — Blind Verifier rejected payment payload' : 'FAILED'}
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Click "Execute Test" above or "Run All 10 Tests" to run this attack against the live verifier.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
