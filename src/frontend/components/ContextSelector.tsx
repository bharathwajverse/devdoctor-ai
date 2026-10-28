import React from 'react';
import { Terminal, Globe, Code2, Box, GitBranch, Monitor } from 'lucide-react';
import { EnvironmentContext } from '../../shared/types.js';

interface ContextOption {
  id: EnvironmentContext;
  label: string;
  icon: React.ElementType;
}

const CONTEXTS: ContextOption[] = [
  { id: 'terminal', label: 'Terminal / CLI', icon: Terminal },
  { id: 'browser', label: 'Web Console', icon: Globe },
  { id: 'ide', label: 'IDE / Editor', icon: Code2 },
  { id: 'docker', label: 'Docker Container', icon: Box },
  { id: 'cicd', label: 'CI/CD Pipeline', icon: GitBranch },
  { id: 'system', label: 'OS / System', icon: Monitor },
];

interface ContextSelectorProps {
  selected: EnvironmentContext;
  onSelect: (ctx: EnvironmentContext) => void;
  disabled?: boolean;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  selected,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
        Error Environment Context
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {CONTEXTS.map((item) => {
          const Icon = item.icon;
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm shadow-indigo-500/20'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
