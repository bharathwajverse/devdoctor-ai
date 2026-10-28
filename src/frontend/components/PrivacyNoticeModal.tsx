import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Terminal, AlertTriangle } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <span>Security & Privacy Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 text-sm text-slate-300">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Local-First Model Execution</h4>
              <p className="text-xs text-slate-400 mt-1">
                When configured with local Ollama (<code className="text-indigo-300">gemma4</code> / <code className="text-indigo-300">paligemma</code>), all image tokens remain strictly on your local machine. No external cloud receives your screenshot.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <EyeOff className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Zero Server Retention</h4>
              <p className="text-xs text-slate-400 mt-1">
                Screenshots are streamed in memory as transient base64 buffers during active inference and immediately garbage-collected upon response completion. No files or images are written to disk or databases.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-200">Redact Sensitive Secrets</h4>
              <p className="text-xs text-amber-300/80 mt-1">
                Do NOT upload screenshots containing plain-text passwords, private API tokens, AWS keys, database connection strings, or personal confidential data.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Terminal className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">No Autonomous Command Execution</h4>
              <p className="text-xs text-slate-400 mt-1">
                devdoctor-ai provides recommendations with risk classifications (<span className="text-emerald-400">Safe</span>, <span className="text-amber-400">Moderate</span>, <span className="text-rose-400">Risky</span>). It will NEVER execute shell commands on your operating system automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
