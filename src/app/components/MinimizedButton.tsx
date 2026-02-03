import React from 'react';
import { Maximize2, Settings } from 'lucide-react';
import { LiquidGlass } from '@/app/components/LiquidGlass';

interface MinimizedButtonProps {
  onClick: () => void;
  onSettingsClick: () => void;
}

export function MinimizedButton({ onClick, onSettingsClick }: MinimizedButtonProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-2">
      <LiquidGlass
        blurAmount={20}
        opacity={0.8}
        borderRadius={16}
        enableHoverEffect={true}
      >
        <button
          onClick={onClick}
          className="p-4 w-full h-full flex items-center justify-center hover:scale-105 transition-transform"
          title="Expand HUD (Ctrl+H)"
        >
          <Maximize2 className="w-5 h-5 text-cyan-300" />
        </button>
      </LiquidGlass>

      <LiquidGlass
        blurAmount={16}
        opacity={0.6}
        borderRadius={12}
        enableHoverEffect={true}
      >
        <button
          onClick={onSettingsClick}
          className="p-3 w-full h-full flex items-center justify-center hover:scale-105 transition-transform"
          title="Settings (Ctrl+S)"
        >
          <Settings className="w-4 h-4 text-white/60" />
        </button>
      </LiquidGlass>
    </div>
  );
}
