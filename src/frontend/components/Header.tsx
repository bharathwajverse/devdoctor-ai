import React from 'react';
import { Stethoscope, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { HealthResponse } from '../../shared/types.js';

interface HeaderProps {
  health: HealthResponse | null;
  demoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
  onOpenPrivacyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  demoMode,
  onToggleDemoMode,
  onOpenPrivacyModal,
}) => {
  const isConnected = health?.ollama?.connected;
  const activeModel = health?.modelIdentifier || 'gemma4';

  return (
    <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                devdoctor<span className="text-indigo-400">.ai</span>
              </h1>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Multimodal MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Understand errors. Find the cause. Fix with confidence.
            </p>
          </div>
        </div>

        {/* Status badges & controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Engine status indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Ollama Live ({activeModel})
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  Ollama Offline
                </span>
              )}
            </span>
          </div>

          {/* Demo Mode Toggle */}
          <button
            onClick={() => onToggleDemoMode(!demoMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              demoMode
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle between Live Model Inference and Deterministic Sample Demo Mode"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Demo Mode: {demoMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Privacy & Security Modal Button */}
          <button
            onClick={onOpenPrivacyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <span>Privacy</span>
          </button>
        </div>
      </div>
    </header>
  );
};
