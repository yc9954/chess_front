import React, { useState } from 'react';
import { X, Brain, Target, Clock, AlertTriangle, Settings } from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';
import { Slider } from '@/app/components/ui/slider';

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents: (ignore: boolean) => void;
    };
  }
}

interface SettingsControlProps {
  isOpen: boolean;
  onClose: () => void;
  autoMoveEnabled: boolean;
  onAutoMoveChange: (enabled: boolean) => void;
  aiDepth: number;
  onAiDepthChange: (depth: number) => void;
  humanDelay: number;
  onHumanDelayChange: (delay: number) => void;
}

export function SettingsControl({
  isOpen,
  onClose,
  autoMoveEnabled,
  onAutoMoveChange,
  aiDepth,
  onAiDepthChange,
  humanDelay,
  onHumanDelayChange,
}: SettingsControlProps) {
  if (!isOpen) return null;

  const setIgnore = (ignore: boolean) => {
    if (window.electronAPI) {
      console.log('SettingsControl: setIgnore', ignore);
      window.electronAPI.setIgnoreMouseEvents(ignore);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl pointer-events-auto"
      onMouseEnter={() => setIgnore(false)}
      onMouseLeave={() => setIgnore(false)} // Keep clicks enabled
    >
      <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-3xl border border-white/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-cyan-400/10 to-blue-400/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-400/20 border border-white/30">
                <Settings className="w-5 h-5 text-cyan-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">Control Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Auto-Move Toggle */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-400/20 border border-white/30">
                  <Target className="w-5 h-5 text-green-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Auto-Move</h3>
                  <p className="text-xs text-white/60">Automatically execute best moves</p>
                </div>
              </div>
              <Switch
                checked={autoMoveEnabled}
                onCheckedChange={onAutoMoveChange}
              />
            </div>

            {autoMoveEnabled && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-400/15 border border-yellow-300/40 backdrop-blur-xl">
                <AlertTriangle className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-200">
                  <span className="font-semibold">Stealth Mode Active:</span> Use responsibly.
                  Detection may occur on some platforms.
                </div>
              </div>
            )}
          </div>

          {/* AI Thinking Depth */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-400/20 border border-white/30">
                <Brain className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">AI Thinking Depth</h3>
                <p className="text-xs text-white/60">Higher = stronger, slower</p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-purple-400/20 border border-white/30">
                <span className="text-sm font-mono font-semibold text-purple-300">{aiDepth}</span>
              </div>
            </div>

            <Slider
              value={[aiDepth]}
              onValueChange={(values) => onAiDepthChange(values[0])}
              min={10}
              max={30}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between mt-2 text-xs text-white/50">
              <span>10 (Fast)</span>
              <span>30 (Strong)</span>
            </div>
          </div>

          {/* Human-like Delay */}
          <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-400/20 border border-white/30">
                <Clock className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Human-like Delay</h3>
                <p className="text-xs text-white/60">Milliseconds before auto-move</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                value={humanDelay}
                onChange={(e) => onHumanDelayChange(Number(e.target.value))}
                min={100}
                max={5000}
                step={100}
                className="flex-1 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/30 text-white text-sm font-mono focus:outline-none focus:border-blue-300/60 focus:ring-2 focus:ring-blue-300/30"
              />
              <span className="text-sm text-white/60">ms</span>
            </div>

            <div className="mt-3 text-xs text-white/50">
              Recommended: 500-2000ms for natural behavior
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/20 bg-white/5">
          <p className="text-xs text-center text-white/50">
            Settings are saved locally. Use ethically and at your own risk.
          </p>
        </div>
      </div>
    </div>
  );
}