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
  FileText,
  Scan,
} from 'lucide-react';
import { Header } from './components/Header.js';
import { UploadZone } from './components/UploadZone.js';
import { SamplePicker } from './components/SamplePicker.js';
import { ContextSelector } from './components/ContextSelector.js';
import { DiagnosisView } from './components/DiagnosisView.js';
import { VerificationModal } from './components/VerificationModal.js';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal.js';
import { extractTextFromImage } from './utils/ocr.js';
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
  const [imageMeta, setImageMeta] = useState<{ name: string; sizeBytes: number; mimeType: string } | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrWarning, setOcrWarning] = useState<string | null>(null);

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

  const runOcr = async (dataUri: string) => {
    setIsOcrRunning(true);
    setOcrProgress(0);
    setOcrStatus('Initializing local OCR...');
    setOcrWarning(null);

    try {
      const res = await extractTextFromImage(dataUri, (p) => {
        setOcrProgress(p.progress);
        setOcrStatus(p.status === 'recognizing text' ? `Extracting text... ${p.progress}%` : p.status);
      });

      if (res.success && res.text) {
        setExtractedText(res.text);
        setOcrConfidence(Math.round(res.confidence));
        setOcrWarning(null);
      } else {
        setExtractedText('');
        setOcrConfidence(0);
        setOcrWarning('No clear text detected by OCR. You can type or paste the error text directly into the box below.');
      }
    } catch (err: any) {
      setExtractedText('');
      setOcrConfidence(null);
      setOcrWarning('OCR processing error. Please type or paste the error text into the box below.');
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleImageSelected = (
    dataUri: string,
    meta?: { name: string; sizeBytes: number; mimeType: string }
  ) => {
    setImage(dataUri);
    if (meta) setImageMeta(meta);
    setErrorMsg(null);
    setDiagnosis(null);
    runOcr(dataUri);
  };

  const handleImageCleared = () => {
    setImage(null);
    setImageMeta(null);
    setExtractedText('');
    setOcrConfidence(null);
    setOcrWarning(null);
    setDiagnosis(null);
    setErrorMsg(null);
  };

  const handleDiagnose = async () => {
    if (!image && !extractedText.trim()) {
      setErrorMsg('Please provide an error screenshot or enter error text.');
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
          extractedText: extractedText.trim(),
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
            <span>Open-Weight Llama 3 Debugging Assistant</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Turn Error Screenshots into <span className="text-indigo-400">Actionable Fixes</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Extract visible errors client-side via Tesseract.js OCR, reason through root causes with local Llama 3, and verify remediation with follow-up screenshots.
          </p>

          {/* Sample Error Scenarios */}
          <div className="pt-2 max-w-3xl mx-auto">
            <SamplePicker
              disabled={isLoading || isOcrRunning}
              onSelectSample={(sampleUri, sampleContext, sampleDesc, meta, sampleSnippet) => {
                setImage(sampleUri);
                if (meta) setImageMeta(meta);
                setContext(sampleContext);
                setDescription(sampleDesc);
                setDiagnosis(null);
                setErrorMsg(null);
                if (sampleSnippet) {
                  setExtractedText(sampleSnippet);
                  setOcrConfidence(99);
                  setOcrWarning(null);
                } else {
                  runOcr(sampleUri);
                }
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
              imageMeta={imageMeta}
              onImageSelected={handleImageSelected}
              onImageCleared={handleImageCleared}
              disabled={isLoading || isOcrRunning}
            />
          </div>

          {/* Step 2: Local OCR Extracted Text Preview / Editor */}
          {image && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scan className="h-4 w-4 text-indigo-400" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Step 2 • Extracted Error Text (Tesseract.js OCR)
                  </label>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Client-Side Private
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {ocrConfidence !== null && !isOcrRunning && (
                    <span className="text-[11px] text-slate-400">
                      OCR Confidence: <strong className="text-indigo-300">{ocrConfidence}%</strong>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => image && runOcr(image)}
                    disabled={isOcrRunning || isLoading}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isOcrRunning ? 'animate-spin' : ''}`} />
                    <span>Re-scan OCR</span>
                  </button>
                </div>
              </div>

              {isOcrRunning ? (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-indigo-300">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>{ocrStatus || 'Extracting visible text locally...'}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 transition-all duration-300"
                      style={{ width: `${Math.max(5, ocrProgress)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    rows={5}
                    placeholder="Extracted error stack trace or compiler output will appear here. You can manually edit, fix typos, or paste additional lines."
                    disabled={isLoading}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Llama 3 reasons on this text to deduce root causes & CLI fixes</span>
                    <span>{extractedText.length} characters</span>
                  </div>
                </div>
              )}

              {ocrWarning && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>{ocrWarning}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Context */}
          <ContextSelector
            selected={context}
            onSelect={setContext}
            disabled={isLoading || isOcrRunning}
          />

          {/* Step 4: Optional description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Step 4 • Additional Context (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Occurred right after running 'npm update' or changing tsconfig"
              disabled={isLoading || isOcrRunning}
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
              <span>Zero server image retention • Local Llama 3 reasoning</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {(diagnosis || image) && (
                <button
                  onClick={handleImageCleared}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Clear All
                </button>
              )}

              <button
                onClick={handleDiagnose}
                disabled={isLoading || isOcrRunning || (!image && !extractedText.trim())}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Llama 3 Reasoning...</span>
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4" />
                    <span>Diagnose with Llama 3</span>
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
            <span>Powered by Llama 3 &amp; Local OCR</span>
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
