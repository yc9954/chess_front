import React from 'react';
import { Slider } from '@/app/components/ui/slider';
import { X, Droplets, Maximize2, Eye } from 'lucide-react';

export interface WidgetConfig {
  blurAmount: number;
  opacity: number;
  scale: number;
  enableEffects: boolean;
}

interface WidgetSettingsProps {
  config: WidgetConfig;
  onConfigChange: (config: WidgetConfig) => void;
  onClose: () => void;
}

export function WidgetSettings({
  config,
  onConfigChange,
  onClose,
}: WidgetSettingsProps) {
  const handleChange = (key: keyof WidgetConfig, value: number | boolean) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-2xl border-b border-gray-300/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-600" />
          Liquid Glass Settings
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-gray-500/10 border border-gray-400/20 hover:bg-red-500/20 hover:border-red-400/30 transition-all"
        >
          <X className="w-3.5 h-3.5 text-gray-700" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Blur Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Droplets className="w-3 h-3" />
              Blur Intensity
            </label>
            <span className="text-xs font-mono text-blue-600">{config.blurAmount}px</span>
          </div>
          <Slider
            value={[config.blurAmount]}
            onValueChange={([value]) => handleChange('blurAmount', value)}
            min={0}
            max={10}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Opacity
            </label>
            <span className="text-xs font-mono text-blue-600">{Math.round(config.opacity * 100)}%</span>
          </div>
          <Slider
            value={[config.opacity * 100]}
            onValueChange={([value]) => handleChange('opacity', value / 100)}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3" />
              Widget Scale
            </label>
            <span className="text-xs font-mono text-blue-600">{Math.round(config.scale * 100)}%</span>
          </div>
          <Slider
            value={[config.scale * 100]}
            onValueChange={([value]) => handleChange('scale', value / 100)}
            min={70}
            max={130}
            step={5}
            className="w-full"
          />
        </div>

        {/* Enable Effects Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200/30">
          <label className="text-xs font-medium text-gray-700">Interactive Effects</label>
          <button
            onClick={() => handleChange('enableEffects', !config.enableEffects)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              config.enableEffects ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                config.enableEffects ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200/30">
        <p className="text-[10px] text-gray-500 text-center">
          Settings are saved automatically
        </p>
      </div>
    </div>
  );
}
