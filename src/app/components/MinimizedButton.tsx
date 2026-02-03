import React from 'react';
import { Maximize2, Settings } from 'lucide-react';

interface MinimizedButtonProps {
  onClick: () => void;
  onSettingsClick: () => void;
}

export function MinimizedButton({ onClick, onSettingsClick }: MinimizedButtonProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-2">
      <button
        onClick={onClick}
        className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/15 hover:border-cyan-300/30 hover:bg-slate-800/90 transition-all shadow-xl"
        title="Expand HUD (Ctrl+H)"
      >
        <Maximize2 className="w-5 h-5 text-cyan-300" />
      </button>
      <button
        onClick={onSettingsClick}
        className="p-3 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-slate-800/70 transition-all"
        title="Settings (Ctrl+S)"
      >
        <Settings className="w-4 h-4 text-white/60" />
      </button>
    </div>
  );
}
