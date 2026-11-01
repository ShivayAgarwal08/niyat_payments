import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { SecurityScenario, SecurityRunResult } from '../services/types.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  FlaskConical,
  Play,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2
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
    <div className="px-4 py-5 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FDF5E7] text-[#D99A32] border border-[#F5DFB3] flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-[#D99A32]" />
            Security Sandbox
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
            10 Test Vectors
          </span>
        </div>
        <h1 className="text-xl font-black text-[#261633] tracking-tight">
          Adversarial Security Lab
        </h1>
        <p className="text-xs text-[#766B82] leading-relaxed">
          Executes real adversarial attacks against the deterministic Blind Verifier to prove zero prompt injection bypasses.
        </p>
      </div>

      {/* Global Run All Button */}
      <button
        onClick={handleRunAll}
        disabled={runningAll || runningId !== null}
        className="niyat-btn-primary w-full py-3 px-4 text-xs flex items-center justify-center gap-2 shadow-card disabled:opacity-50 active:scale-[0.98]"
      >
        {runningAll ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Executing All 10 Adversarial Vectors...</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-bold">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run All 10 Adversarial Tests</span>
          </span>
        )}
      </button>

      {/* Scenario Horizontal Carousel / Selector Pills */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] px-1">
          Select Attack Scenario:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {scenarios.map((sc, idx) => {
            const res = results[sc.id];
            const isSelected = activeTab === sc.id;
            const isRunning = runningId === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => setActiveTab(sc.id)}
                className={`text-left p-2.5 rounded-xl border transition shrink-0 max-w-[190px] ${
                  isSelected
                    ? 'border-[#663A91] bg-[#F3EDF9] ring-1 ring-[#663A91]'
                    : 'border-[#E8E2EF] bg-white hover:border-[#D6CCE3]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#766B82]">
                    #{idx + 1}
                  </span>
                  <div>
                    {isRunning ? (
                      <span className="w-2.5 h-2.5 border-2 border-[#663A91]/30 border-t-[#663A91] rounded-full animate-spin inline-block" />
                    ) : res ? (
                      res.blocked ? (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#168451] bg-[#E8F6EE] px-1.5 py-0.5 rounded-full border border-[#C4E8D3]">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#D64C55] bg-[#FBEDED] px-1.5 py-0.5 rounded-full border border-[#F7D2D5]">
                          FAILED
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] text-[#766B82]">Ready</span>
                    )}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-[#261633] truncate">
                  {sc.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Scenario Inspector */}
      {activeScenario && (
        <div className="niyat-card p-4 space-y-4 shadow-card">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#E8E2EF]">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#663A91]">
                {activeScenario.category}
              </span>
              <h2 className="text-sm font-extrabold text-[#261633]">
                {activeScenario.name}
              </h2>
            </div>

            <button
              onClick={() => handleRunScenario(activeScenario.id)}
              disabled={runningId === activeScenario.id}
              className="niyat-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {runningId === activeScenario.id ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Testing...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute Test</span>
                </span>
              )}
            </button>
          </div>

          {/* Scenario Details */}
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] block">Attack Description:</span>
              <p className="text-xs text-[#261633] mt-0.5 leading-relaxed">{activeScenario.description}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#FBEDED] border border-[#F7D2D5]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D64C55] block">Malicious Attack Vector:</span>
              <p className="font-mono text-[11px] text-[#D64C55] font-semibold mt-0.5 whitespace-pre-wrap leading-relaxed">
                {activeScenario.attackVector}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F3F1F8] border border-[#E8E2EF]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82] block">Baseline Prompt:</span>
              <p className="font-semibold text-xs text-[#261633] mt-0.5">"{activeScenario.defaultPrompt}"</p>
            </div>
          </div>

          {/* Execution Comparison */}
          {activeResult ? (
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#766B82]">
                Execution Comparison
              </span>

              <div className="space-y-2.5">
                {/* Normal AI Agent Outcome */}
                <div className="p-3.5 rounded-2xl border border-[#F7D2D5] bg-[#FBEDED]/40 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-xs text-[#D64C55]">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Normal AI Agent
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FBEDED] text-[#D64C55] border border-[#F7D2D5] text-[10px]">
                      VULNERABLE
                    </span>
                  </div>
                  <p className="text-[11px] text-[#261633] leading-relaxed">
                    {activeResult.normalModeResult.explanation}
                  </p>
                  <span className="text-[10px] font-bold text-[#D64C55] block">
                    Result: Unauthorized transaction allowed by standard agent.
                  </span>
                </div>

                {/* NIYAT Firewall Outcome */}
                <div className="p-3.5 rounded-2xl border border-[#C4E8D3] bg-[#E8F6EE]/40 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-xs text-[#168451]">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      NIYAT Intent Firewall
                    </span>
                    <StatusBadge status={activeResult.verifierDecision} size="sm" />
                  </div>
                  <p className="text-[11px] text-[#261633] font-medium leading-relaxed">
                    Deterministic Decision: <span className="font-bold">{activeResult.verifierDecision}</span>
                  </p>
                  <p className="text-[10px] text-[#168451] leading-relaxed">
                    <span className="font-bold">Firewall Verdict: </span>
                    {activeResult.reason}
                  </p>
                </div>
              </div>

              {/* Status Banner — Deep Plum Panel */}
              <div className="niyat-card-plum p-3.5 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8E2EF]/70 block">
                  Blind Verifier Audit Result
                </span>
                <p className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                  {activeResult.blocked ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#168451] shrink-0" />
                      <span>ATTACK DEFLECTED — Payment Blocked Deterministically</span>
                    </>
                  ) : (
                    <span>FAILED</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#766B82] border border-dashed border-[#E8E2EF] rounded-2xl">
              Tap "Execute Test" or "Run All 10 Tests" to run this adversarial vector against the Blind Verifier.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
