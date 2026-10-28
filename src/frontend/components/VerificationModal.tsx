import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  UploadCloud,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DiagnosisResult, VerificationResult } from '../../shared/types.js';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalDiagnosis: DiagnosisResult;
  demoMode: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  originalDiagnosis,
  demoMode,
}) => {
  const [verificationImage, setVerificationImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Screenshot exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setVerificationImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!verificationImage) {
      setErrorMsg('Please upload a follow-up screenshot to verify.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalAnalysis: originalDiagnosis,
          verificationImage,
          notes,
          demoMode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Verification request failed');
      }

      const data = (await res.json()) as VerificationResult;
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyStepAction = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getStatusBadge = (status: VerificationResult['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-200 text-sm">Problem Resolved</h4>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Visual evidence indicates the previous error condition is no longer occurring.
              </p>
            </div>
          </div>
        );
      case 'still_present':
        return (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <h4 className="font-bold text-rose-200 text-sm">Error Still Present</h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                The identical error remains visible. Review the root causes and attempt the alternative troubleshooting steps.
              </p>
            </div>
          </div>
        );
      case 'new_error':
        return (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="font-bold text-amber-200 text-sm">New Error Encountered</h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                The initial error cleared, but an downstream exception has surfaced.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <HelpCircle className="h-6 w-6 text-slate-400 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-200 text-sm">Inconclusive Result</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                The follow-up screenshot lacks sufficient visual context to confirm resolution.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-lg">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span>Closed-Loop Screenshot Verification</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="mt-4 space-y-4 overflow-y-auto pr-1">
          {/* Reference initial diagnosis banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="truncate max-w-md">
              Verifying: <strong className="text-slate-200">{originalDiagnosis.headline}</strong>
            </span>
            <span className="font-mono text-indigo-400 text-[11px] shrink-0">
              ID: {originalDiagnosis.id}
            </span>
          </div>

          {!result ? (
            /* Upload & Input Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  1. Follow-up Screenshot (After applying fix)
                </label>
                {verificationImage ? (
                  <div className="relative rounded-xl border border-slate-700 bg-slate-950 p-2 flex items-center justify-center">
                    <img
                      src={verificationImage}
                      alt="Verification Screenshot"
                      className="max-h-48 w-auto object-contain rounded-lg"
                    />
                    <button
                      onClick={() => setVerificationImage(null)}
                      className="absolute top-3 right-3 px-2 py-1 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/80 cursor-pointer transition-all">
                    <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
                    <span className="text-xs font-semibold text-white">
                      Upload second screenshot of your terminal or screen
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">PNG, JPEG, WebP</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  2. Troubleshooting Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ran npm install express, re-executed npm run dev"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}
            </div>
          ) : (
            /* Results View */
            <div className="space-y-4">
              {getStatusBadge(result.status)}

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <h5 className="font-semibold text-white">Comparison Summary</h5>
                <p className="leading-relaxed">{result.comparisonSummary}</p>
              </div>

              {result.observations.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h5 className="text-xs font-semibold text-white">Visual Observations</h5>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {result.observations.map((obs, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.nextSteps.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-white">Recommended Next Steps</h5>
                  {result.nextSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-white">
                        <span>{step.title}</span>
                      </div>
                      <p className="text-xs text-slate-400">{step.explanation}</p>
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300">
                        <span className="truncate">{step.action}</span>
                        <button
                          onClick={() => copyStepAction(step.action, idx)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {result ? 'Done' : 'Cancel'}
          </button>

          {!result ? (
            <button
              onClick={handleVerify}
              disabled={isLoading || !verificationImage}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Evaluating Resolution...</span>
                </>
              ) : (
                <>
                  <span>Evaluate Resolution</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                setResult(null);
                setVerificationImage(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              Upload Another Test Screenshot
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
