'use client';

import { useState } from 'react';

interface Tool {
  id: string;
  icon: string;
  description: string;
  category: 'view' | 'measure' | 'draw' | 'transform';
}

const TOOLS: Tool[] = [
  // View Tools
  { id: 'zoom-in', icon: '🔍', description: 'Agrandir (Scroll +)', category: 'view' },
  { id: 'zoom-out', icon: '🔍', description: 'Réduire (Scroll -)', category: 'view' },
  { id: 'pan', icon: '✋', description: 'Déplacer (Bouton milieu)', category: 'view' },

  // Measurement Tools
  { id: 'measure-distance', icon: '📏', description: 'Mesurer distance', category: 'measure' },
  { id: 'measure-angle', icon: '∠', description: 'Mesurer angle', category: 'measure' },
  { id: 'measure-area', icon: '⊞', description: 'Mesurer surface', category: 'measure' },

  // Drawing Tools
  { id: 'draw-rectangle', icon: '▭', description: 'Tracer rectangle', category: 'draw' },
  { id: 'draw-circle', icon: '●', description: 'Tracer cercle', category: 'draw' },
  { id: 'draw-line', icon: '—', description: 'Tracer ligne', category: 'draw' },
  { id: 'draw-text', icon: '𝐀', description: 'Ajouter texte', category: 'draw' },

  // Transform Tools
  { id: 'rotate', icon: '↻', description: 'Rotation 90°', category: 'transform' },
  { id: 'flip', icon: '↔', description: 'Miroir horizontal', category: 'transform' },
  { id: 'invert', icon: '◐', description: 'Inverser couleurs', category: 'transform' },
];

interface ToolsPanelProps {
  onToolSelect?: (toolId: string) => void;
}

export default function ToolsPanel({ onToolSelect }: ToolsPanelProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleToolClick = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId);
    onToolSelect?.(toolId);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all transform hover:scale-110 ${
            activeTool === tool.id
              ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg ring-2 ring-blue-400/50 scale-110'
              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600/50'
          }`}
          title={tool.description}
        >
          <span className="text-lg">{tool.icon}</span>
        </button>
      ))}
    </div>
  );
}
