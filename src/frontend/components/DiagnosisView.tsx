import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  FileCode,
  Layers,
  Wrench,
  HelpCircle,
} from 'lucide-react';
import { DiagnosisResult, TroubleshootingStep } from '../../shared/types.js';

interface DiagnosisViewProps {
  diagnosis: DiagnosisResult;
  onOpenVerification: () => void;
}

export const DiagnosisView: React.FC<DiagnosisViewProps> = ({
  diagnosis,
  onOpenVerification,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (typeof index === 'number') {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  const getRiskBadge = (risk: 'safe' | 'moderate' | 'risky') => {
    switch (risk) {
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Safe Action
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" /> Moderate Risk
          </span>
        );
      case 'risky':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-3 w-3" /> Destructive / Risky
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Demo watermark banner */}
      {diagnosis.isDemo && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="font-semibold">
              {diagnosis.demoWatermark || '[DEMO / SAMPLE DATA - NO LIVE MODEL CONNECTED]'}
            </span>
          </div>
          <span className="text-[11px] text-amber-300/80 hidden sm:inline">
            Deterministic Evaluation Sample
          </span>
        </div>
      )}

      {/* Main Headline & Summary Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {diagnosis.context}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Model: {diagnosis.modelUsed}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Diagnosis Confidence:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {Math.round(diagnosis.confidenceScore * 100)}%
            </span>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {diagnosis.headline}
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {diagnosis.summary}
          </p>
        </div>
      </div>

      {/* Extracted Evidence Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <FileCode className="h-5 w-5 text-indigo-400" />
            <h3>Visible Screenshot Evidence</h3>
          </div>
          <button
            onClick={() => copyToClipboard(diagnosis.evidence.rawText)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            {copiedRaw ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Evidence</span>
              </>
            )}
          </button>
        </div>

        {diagnosis.evidence.uncertain && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <HelpCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Visual Uncertainty Detected:</strong> Part of the error trace in the screenshot appears blurry, truncated, or low-contrast. Verify line numbers and file paths manually.
            </span>
          </div>
        )}

        {/* Evidence metadata chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] uppercase">Error Type</span>
            <span className="font-mono font-semibold text-rose-400">
              {diagnosis.evidence.errorType || 'Unknown'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] uppercase">Error Code</span>
            <span className="font-mono text-slate-200">
              {diagnosis.evidence.errorCode || 'N/A'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] uppercase">File & Line</span>
            <span className="font-mono text-slate-200 truncate block">
              {diagnosis.evidence.filePath ? `${diagnosis.evidence.filePath}:${diagnosis.evidence.lineNumber || '?'}` : 'Not visible'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px] uppercase">Suspect Component</span>
            <span className="text-slate-200 truncate block">
              {diagnosis.evidence.suspectComponent || 'System'}
            </span>
          </div>
        </div>

        {/* Verbatim code block */}
        <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-48 whitespace-pre">
          {diagnosis.evidence.rawText}
        </div>
      </div>

      {/* Root Causes Hypotheses */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Layers className="h-5 w-5 text-indigo-400" />
          <h3>Likely Causes & Probability</h3>
        </div>

        <div className="space-y-3">
          {diagnosis.rootCauses.map((rc, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{rc.cause}</span>
                <span className="font-mono font-bold text-indigo-400">
                  {Math.round(rc.probability * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(rc.probability * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{rc.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prioritized Troubleshooting Steps */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Wrench className="h-5 w-5 text-indigo-400" />
            <h3>Prioritized Troubleshooting Actions</h3>
          </div>
          <span className="text-xs text-slate-400">Ordered by safety and impact</span>
        </div>

        <div className="space-y-4">
          {diagnosis.troubleshootingSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                    {step.stepNumber}
                  </span>
                  <h4 className="font-semibold text-white text-sm">{step.title}</h4>
                </div>
                {getRiskBadge(step.riskLevel)}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{step.explanation}</p>

              {/* Action command with copy button */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300">
                <span className="truncate selection:bg-indigo-600 selection:text-white">
                  {step.action}
                </span>
                <button
                  onClick={() => copyToClipboard(step.action, idx)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {step.rollbackAdvice && (
                <div className="text-[11px] text-amber-400/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  <strong>Rollback / Precaution:</strong> {step.rollbackAdvice}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Safety Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>{diagnosis.safetyNotice}</span>
        </div>
      </div>

      {/* Closed-Loop Verification CTA */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Ready to test if this fixed the issue?
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Upload a follow-up screenshot of your terminal or screen to verify whether the error appears resolved.
          </p>
        </div>

        <button
          onClick={onOpenVerification}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <span>Verify Fix with 2nd Screenshot</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
