import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Sparkles,
  ArrowRight,
  Loader2,
  RefreshCw,
  Github,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Header } from './components/Header.js';
import { UploadZone } from './components/UploadZone.js';
import { SamplePicker } from './components/SamplePicker.js';
import { ContextSelector } from './components/ContextSelector.js';
import { DiagnosisView } from './components/DiagnosisView.js';
import { VerificationModal } from './components/VerificationModal.js';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal.js';
import {
  HealthResponse,
  DiagnosisResult,
  EnvironmentContext,
} from '../shared/types.js';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const [image, setImage] = useState<string | null>(null);
  const [context, setContext] = useState<EnvironmentContext>('terminal');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  // Poll health on mount
  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = (await res.json()) as HealthResponse;
        setHealth(data);
        if (!data.ollama.connected && !data.google.configured) {
          setDemoMode(true);
        }
      }
    } catch {
      // Backend not yet reachable; default demoMode to true
      setDemoMode(true);
    }
  };

  const handleImageSelected = (dataUri: string) => {
    setImage(dataUri);
    setErrorMsg(null);
  };

  const handleImageCleared = () => {
    setImage(null);
    setDiagnosis(null);
    setErrorMsg(null);
  };

  const handleDiagnose = async () => {
    if (!image) {
      setErrorMsg('Please upload or paste an error screenshot first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          context,
          description,
          demoMode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Diagnosis request failed');
      }

      const result = (await res.json()) as DiagnosisResult;
      setDiagnosis(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while diagnosing the error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <Header
        health={health}
        demoMode={demoMode}
        onToggleDemoMode={setDemoMode}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Open-Weight Multimodal AI Debugger</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Turn Error Screenshots into <span className="text-indigo-400">Actionable Fixes</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload terminal crashes, compiler errors, or browser exceptions. Get extracted evidence, ranked root causes, and safe troubleshooting steps with closed-loop verification.
          </p>

          {/* Sample Error Scenarios */}
          <div className="pt-2 max-w-3xl mx-auto">
            <SamplePicker
              disabled={isLoading}
              onSelectSample={(sampleUri, sampleContext, sampleDesc) => {
                setImage(sampleUri);
                setContext(sampleContext);
                setDescription(sampleDesc);
                setDiagnosis(null);
                setDemoMode(true);
                setErrorMsg(null);
              }}
            />
          </div>
        </div>

        {/* Input Configuration Box */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-6">
          {/* Step 1: Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Step 1 • Provide Error Screenshot
            </label>
            <UploadZone
              image={image}
              onImageSelected={handleImageSelected}
              onImageCleared={handleImageCleared}
              disabled={isLoading}
            />
          </div>

          {/* Step 2: Context */}
          <ContextSelector
            selected={context}
            onSelect={setContext}
            disabled={isLoading}
          />

          {/* Step 3: Optional description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Step 3 • Additional Context (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Occurred right after running 'npm update' or changing tsconfig"
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Zero server retention • In-memory processing</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {diagnosis && (
                <button
                  onClick={() => {
                    setDiagnosis(null);
                    setImage(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Clear
                </button>
              )}

              <button
                onClick={handleDiagnose}
                disabled={isLoading || !image}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing Error Screenshot...</span>
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4" />
                    <span>Diagnose Screenshot</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Diagnosis Results Section */}
        {diagnosis && (
          <DiagnosisView
            diagnosis={diagnosis}
            onOpenVerification={() => setIsVerificationModalOpen(true)}
          />
        )}
      </main>

      {/* Verification Modal */}
      {diagnosis && (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          originalDiagnosis={diagnosis}
          demoMode={demoMode}
        />
      )}

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>devdoctor-ai</span>
            <span>•</span>
            <span>Apache 2.0 Open Source</span>
            <span>•</span>
            <span>MLH Best Open-Source AI Project</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/bharathwajverse/devdoctor-ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
