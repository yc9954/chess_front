import React from 'react';
import { X, Brain, Target, Clock, AlertTriangle, Settings } from 'lucide-react';
import { Switch } from '@/app/components/ui/switch';
import { Slider } from '@/app/components/ui/slider';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/15 bg-gradient-to-r from-cyan-400/10 to-blue-400/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-400/20 border border-white/20">
                <Settings className="w-4 h-4 text-cyan-300" />
              </div>
              <h2 className="text-sm font-semibold text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/15 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Auto-Move Toggle */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-green-400/15 border border-white/15">
                  <Target className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">Auto-Move</h3>
                  <p className="text-[10px] text-white/50">Automatically execute best moves</p>
                </div>
              </div>
              <Switch
                checked={autoMoveEnabled}
                onCheckedChange={onAutoMoveChange}
              />
            </div>

            {autoMoveEnabled && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-400/10 border border-yellow-300/30">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-300 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-yellow-200">
                  <span className="font-semibold">Stealth Mode Active:</span> Use responsibly.
                </p>
              </div>
            )}
          </div>

          {/* AI Thinking Depth */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-lg bg-purple-400/15 border border-white/15">
                <Brain className="w-4 h-4 text-purple-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-white">AI Depth</h3>
                <p className="text-[10px] text-white/50">Higher = stronger, slower</p>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-purple-400/15 border border-white/15">
                <span className="text-xs font-mono font-semibold text-purple-300">{aiDepth}</span>
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

            <div className="flex justify-between mt-1.5 text-[10px] text-white/40">
              <span>10 (Fast)</span>
              <span>30 (Strong)</span>
            </div>
          </div>

          {/* Human-like Delay */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-400/15 border border-white/15">
                <Clock className="w-4 h-4 text-blue-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-white">Human-like Delay</h3>
                <p className="text-[10px] text-white/50">Milliseconds before auto-move</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={humanDelay}
                onChange={(e) => onHumanDelayChange(Number(e.target.value))}
                min={100}
                max={5000}
                step={100}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-blue-300/50 focus:ring-1 focus:ring-blue-300/20"
              />
              <span className="text-xs text-white/50">ms</span>
            </div>

            <p className="mt-1.5 text-[10px] text-white/40">
              Recommended: 500–2000ms
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02]">
          <p className="text-[10px] text-center text-white/40">
            Settings are saved locally.
          </p>
        </div>
      </div>
    </div>
  );
}
