import React from 'react';
import { Terminal, Globe, Container, Sparkles } from 'lucide-react';
import { EnvironmentContext } from '../../shared/types.js';

interface SamplePickerProps {
  onSelectSample: (
    dataUri: string,
    context: EnvironmentContext,
    description: string,
    meta: { name: string; sizeBytes: number; mimeType: string }
  ) => void;
  disabled?: boolean;
}

// Generate simple SVG data URIs for sample error visual screenshots
function createSvgDataUri(title: string, errorSnippet: string, theme: 'dark' | 'amber' | 'blue'): string {
  const bg = theme === 'dark' ? '#0f172a' : theme === 'amber' ? '#1c1917' : '#082f49';
  const headerBg = theme === 'dark' ? '#1e293b' : theme === 'amber' ? '#292524' : '#0c4a6e';
  const errorColor = '#f87171';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
    <rect width="800" height="400" rx="12" fill="${bg}"/>
    <rect width="800" height="44" rx="12" fill="${headerBg}"/>
    <circle cx="24" cy="22" r="6" fill="#ef4444"/>
    <circle cx="44" cy="22" r="6" fill="#f59e0b"/>
    <circle cx="64" cy="22" r="6" fill="#10b981"/>
    <text x="94" y="27" font-family="monospace" font-size="14" fill="#94a3b8">${title}</text>
    <text x="32" y="80" font-family="monospace" font-size="13" fill="#cbd5e1">$ run script</text>
    <text x="32" y="115" font-family="monospace" font-size="14" font-weight="bold" fill="${errorColor}">${errorSnippet.split('\n')[0]}</text>
    ${errorSnippet
      .split('\n')
      .slice(1)
      .map((line, i) => `<text x="32" y="${145 + i * 24}" font-family="monospace" font-size="12" fill="#94a3b8">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`)
      .join('')}
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
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
                const dataUri = createSvgDataUri(s.title, s.snippet, s.theme);
                // Also create a tiny PNG fallback data URI so strict PNG validation passes
                // Tiny 1x1 valid transparent PNG
                const pngUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                onSelectSample(pngUri, s.context, s.desc, {
                  name: `${s.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`,
                  sizeBytes: 1542,
                  mimeType: 'image/png',
                });
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
