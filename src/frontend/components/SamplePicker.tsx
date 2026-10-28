import React from 'react';
import { Terminal, Globe, Container, Sparkles } from 'lucide-react';
import { EnvironmentContext } from '../../shared/types.js';

interface SamplePickerProps {
  onSelectSample: (
    dataUri: string,
    context: EnvironmentContext,
    description: string,
    meta: { name: string; sizeBytes: number; mimeType: string },
    snippet?: string
  ) => void;
  disabled?: boolean;
}

// Generate realistic canvas-rendered PNG data URIs for sample error visual screenshots
function createSampleCanvasPng(title: string, errorSnippet: string, theme: 'dark' | 'amber' | 'blue'): string {
  const fallbackPng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  if (typeof document === 'undefined') {
    return fallbackPng;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallbackPng;

    const bg = theme === 'dark' ? '#0f172a' : theme === 'amber' ? '#1c1917' : '#082f49';
    const headerBg = theme === 'dark' ? '#1e293b' : theme === 'amber' ? '#292524' : '#0c4a6e';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 800, 360);

    ctx.fillStyle = headerBg;
    ctx.fillRect(0, 0, 800, 44);

    // Window controls
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(24, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(44, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(64, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Window title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(title, 94, 27);

    // Command line
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px monospace';
    ctx.fillText('$ run script', 32, 80);

    // Error text lines
    const lines = errorSnippet.split('\n');
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(lines[0] || '', 32, 115);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    for (let i = 1; i < lines.length; i++) {
      ctx.fillText(lines[i], 32, 115 + i * 24);
    }

    return canvas.toDataURL('image/png');
  } catch {
    return fallbackPng;
  }
}

export const SamplePicker: React.FC<SamplePickerProps> = ({
  onSelectSample,
  disabled = false,
}) => {
  const samples = [
    {
      title: "Node.js MODULE_NOT_FOUND",
      context: 'terminal' as EnvironmentContext,
      desc: "Ran node server.js after cloning repo",
      snippet: "Error: Cannot find module 'express'\nRequire stack:\n- /app/src/backend/server.js:1\n- node:internal/modules/cjs/loader:1080",
      theme: 'dark' as const,
      icon: Terminal,
    },
    {
      title: "React TypeError undefined.map",
      context: 'browser' as EnvironmentContext,
      desc: "Page crashed on initial component load",
      snippet: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')\n    at UserList.tsx:24\n    at renderWithHooks (react-dom.js:16305)",
      theme: 'blue' as const,
      icon: Globe,
    },
    {
      title: "Docker Port EADDRINUSE",
      context: 'docker' as EnvironmentContext,
      desc: "Starting postgres container with docker run",
      snippet: "docker: Error response from daemon: Ports are not available:\nlisten tcp 0.0.0.0:5432: bind: address already in use.",
      theme: 'amber' as const,
      icon: Container,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
        <span>Try Sample Error Screenshots</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {samples.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => {
                const pngUri = createSampleCanvasPng(s.title, s.snippet, s.theme);
                onSelectSample(
                  pngUri,
                  s.context,
                  s.desc,
                  {
                    name: `${s.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
                    sizeBytes: Math.round(pngUri.length * 0.75),
                    mimeType: 'image/png',
                  },
                  s.snippet
                );
              }}
              className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:bg-slate-900 hover:border-indigo-500/40 text-left transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 group-hover:text-indigo-300 shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                  {s.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
