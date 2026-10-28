import React, { useState } from 'react';
import {
  ListOrdered,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Undo2,
  Terminal,
} from 'lucide-react';
import { TroubleshootingStep, RiskLevel } from '../../shared/types.js';

interface TroubleshootingListProps {
  steps: TroubleshootingStep[];
}

export const TroubleshootingList: React.FC<TroubleshootingListProps> = ({ steps }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'safe':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
            <ShieldCheck className="h-3 w-3" />
            Safe Action
          </span>
        );
      case 'moderate':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
            <AlertTriangle className="h-3 w-3" />
            Moderate Risk
          </span>
        );
      case 'risky':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-800/40">
            <Flame className="h-3 w-3" />
            Risky / Destructive
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Prioritized Troubleshooting Steps
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          {steps.length} {steps.length === 1 ? 'Step' : 'Steps'} Recommended
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
          >
            {/* Step header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="h-6 w-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-xs">
                  {step.stepNumber || idx + 1}
                </span>
                <h4 className="text-sm font-semibold text-white">{step.title}</h4>
              </div>

              {getRiskBadge(step.riskLevel)}
            </div>

            {/* Explanation */}
            <p className="text-xs text-slate-300 leading-relaxed pl-8">
              {step.explanation}
            </p>

            {/* Action / Command Block */}
            {step.action && (
              <div className="pl-8">
                <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800 p-2.5 font-mono text-xs text-slate-200">
                  <div className="flex items-center gap-2 overflow-x-auto mr-2">
                    <Terminal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="select-all">{step.action}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(step.action, idx)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                    title="Copy command to clipboard"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Rollback Advice */}
            {step.rollbackAdvice && (
              <div className="pl-8">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs text-slate-400">
                  <Undo2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-300">Rollback guidance:</strong> {step.rollbackAdvice}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
