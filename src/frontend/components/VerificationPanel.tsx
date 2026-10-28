import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Loader2,
  UploadCloud,
  ArrowRight,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import {
  DiagnosisResult,
  VerificationResult,
  VerificationStatus,
} from '../../shared/types.js';

interface VerificationPanelProps {
  originalDiagnosis: DiagnosisResult;
  onVerify: (verificationDataUri: string, notes: string) => Promise<void>;
  verificationResult: VerificationResult | null;
  isLoading: boolean;
  demoMode: boolean;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  originalDiagnosis,
  onVerify,
  verificationResult,
  isLoading,
  demoMode,
}) => {
  const [secondImage, setSecondImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Follow-up screenshot exceeds 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSecondImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!secondImage) return;
    await onVerify(secondImage, notes);
  };

  const getStatusBadge = (status: VerificationStatus, label: string) => {
    switch (status) {
      case 'resolved':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{label || 'Problem Resolved'}</span>
          </div>
        );
      case 'still_present':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 font-bold text-sm">
            <AlertOctagon className="h-4 w-4 text-rose-400" />
            <span>{label || 'Error Still Present'}</span>
          </div>
        );
      case 'new_error':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>{label || 'New Downstream Error'}</span>
          </div>
        );
      case 'inconclusive':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <span>{label || 'Inconclusive Result'}</span>
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <FileCheck className="h-4 w-4" />
            <span>Step 2 — Closed-Loop Verification</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Verify Resolution with a Follow-Up Screenshot
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Applied the recommended fix? Upload your updated screen to verify if the error is resolved.
          </p>
        </div>

        {verificationResult && getStatusBadge(verificationResult.status, verificationResult.statusLabel)}
      </div>

      {/* Upload & Notes Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Screenshot picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Upload Follow-up Screenshot
          </label>

          {secondImage ? (
            <div className="relative rounded-xl border border-slate-700 bg-slate-950 p-2 overflow-hidden flex flex-col items-center justify-center">
              <img
                src={secondImage}
                alt="Verification Screenshot"
                className="max-h-48 w-auto object-contain rounded"
              />
              <button
                type="button"
                onClick={() => setSecondImage(null)}
                className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline"
              >
                Change Follow-up Screenshot
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl bg-slate-950/60 cursor-pointer transition-colors text-center">
              <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
              <span className="text-xs font-semibold text-slate-300">
                Click or Drop Follow-up Screenshot
              </span>
              <span className="text-[11px] text-slate-500 mt-1">PNG, JPEG, WebP</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          )}

          {errorMsg && <p className="text-xs text-rose-400 mt-1.5">{errorMsg}</p>}
        </div>

        {/* Notes & Action */}
        <div className="space-y-3 flex flex-col justify-between">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Action Performed <span className="text-slate-500 font-normal normal-case">(Optional notes)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ran npm install express, now server outputs 'Listening on port 3000'..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!secondImage || isLoading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-xs transition-all shadow-md ${
              !secondImage || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating Screen State Differences...</span>
              </>
            ) : (
              <>
                <span>Verify Fix Now</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-4 animate-in fade-in">
          {verificationResult.isDemo && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Sample verification demonstration data.</span>
            </div>
          )}

          {/* Comparison summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Visual Comparison Assessment
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {verificationResult.comparisonSummary}
            </p>
          </div>

          {/* Observations */}
          {verificationResult.observations && verificationResult.observations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Visual Observations
              </h4>
              <ul className="space-y-1.5">
                {verificationResult.observations.map((obs, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-slate-300 p-2 rounded-lg bg-slate-950/60 border border-slate-800/60"
                  >
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up Next Steps */}
          {verificationResult.nextSteps && verificationResult.nextSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered className="h-3.5 w-3.5 text-slate-400" />
                <span>Next Recommended Actions</span>
              </h4>
              <div className="space-y-2">
                {verificationResult.nextSteps.map((st, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-white">{st.title}:</span>{' '}
                      <span className="text-slate-400">{st.explanation}</span>
                    </div>
                    {st.action && (
                      <code className="text-indigo-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono text-[11px]">
                        {st.action}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
