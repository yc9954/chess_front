import React from 'react';
import { Maximize2, Settings } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents: (ignore: boolean) => void;
    };
  }
}

interface MinimizedButtonProps {
  onClick: () => void;
  onSettingsClick: () => void;
}

export function MinimizedButton({ onClick, onSettingsClick }: MinimizedButtonProps) {
  const setIgnore = (ignore: boolean) => {
    if (window.electronAPI) {
      console.log('MinimizedButton: setIgnore', ignore);
      window.electronAPI.setIgnoreMouseEvents(ignore);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      onMouseEnter={() => setIgnore(false)}
      onMouseLeave={() => setIgnore(false)} // Keep clicks enabled for buttons
    >
      {/* Settings button */}
      <button
        onClick={onSettingsClick}
        className="group p-3 rounded-2xl bg-slate-900/20 backdrop-blur-3xl border border-white/20 hover:border-white/40 hover:bg-slate-900/30 transition-all shadow-xl hover:shadow-2xl"
        title="Open Settings (Ctrl+S)"
      >
        <Settings className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
      </button>

      {/* Expand button */}
      <button
        onClick={onClick}
        className="group p-3 rounded-2xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-3xl border border-white/20 hover:border-white/40 hover:from-cyan-900/30 hover:to-blue-900/30 transition-all shadow-xl hover:shadow-2xl hover:shadow-cyan-400/20"
        title="Expand HUD (Ctrl+H)"
      >
        <Maximize2 className="w-5 h-5 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
      </button>
    </div>
  );
}