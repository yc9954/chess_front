import React, { useState, useEffect } from 'react';
import { TransparentOverlay } from '@/app/components/TransparentOverlay';
import { SettingsControl } from '@/app/components/SettingsControl';
import { MinimizedButton } from '@/app/components/MinimizedButton';
import { WidgetSettings, WidgetConfig } from '@/app/components/WidgetSettings';
import { detectChessBoard } from '@/utils/boardDetection';

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
      resizeWindow: (width: number, height: number) => void;
      getDesktopSources: () => Promise<any[]>;
      checkScreenPermission: () => Promise<string>;
    };
  }
}

const WIDGET_WIDTH = 380;
const WIDGET_HEIGHT = 620;
const MINIMIZED_WIDTH = 80;
const MINIMIZED_HEIGHT = 160;

export default function App() {
  // UI State
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWidgetSettingsOpen, setIsWidgetSettingsOpen] = useState(false);

  // Widget configuration with localStorage persistence
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(() => {
    const saved = localStorage.getItem('widgetConfig');
    return saved ? JSON.parse(saved) : {
      blurAmount: 2,
      opacity: 0.15,
      scale: 1,
      enableEffects: true,
    };
  });

  // Engine State
  const [engineStatus, setEngineStatus] = useState<'idle' | 'analyzing' | 'ready'>('analyzing');
  const [currentScore, setCurrentScore] = useState(45);
  const [aiDepth, setAiDepth] = useState(20);

  // Settings
  const [autoMoveEnabled, setAutoMoveEnabled] = useState(false);
  const [humanDelay, setHumanDelay] = useState(1000);

  // Board detection
  const [boardRect, setBoardRect] = useState({ x: 100, y: 100, width: 600, height: 600 });
  const [isDetecting, setIsDetecting] = useState(false);

  // Mock data
  const bestMove = 'Nf3';
  const topMoves = [
    { notation: 'Nf3', evaluation: 45, isBest: true },
    { notation: 'e4', evaluation: 32, centipawnLoss: 13 },
    { notation: 'd4', evaluation: 28, centipawnLoss: 17 },
  ];

  // Resize window when toggling HUD visibility
  const handleMinimize = () => {
    setIsHudVisible(false);
    window.electronAPI?.resizeWindow(MINIMIZED_WIDTH, MINIMIZED_HEIGHT);
  };

  const handleExpand = () => {
    setIsHudVisible(true);
    window.electronAPI?.resizeWindow(WIDGET_WIDTH, WIDGET_HEIGHT);
  };

  // Save widget config to localStorage
  useEffect(() => {
    localStorage.setItem('widgetConfig', JSON.stringify(widgetConfig));
  }, [widgetConfig]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setIsHudVisible((prev) => {
          const next = !prev;
          if (next) {
            window.electronAPI?.resizeWindow(WIDGET_WIDTH, WIDGET_HEIGHT);
          } else {
            window.electronAPI?.resizeWindow(MINIMIZED_WIDTH, MINIMIZED_HEIGHT);
          }
          return next;
        });
      }

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }

      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setIsWidgetSettingsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Board detection via screen capture
  const runScan = async () => {
    setIsDetecting(true);
    try {
      const permission = await window.electronAPI?.checkScreenPermission();
      if (permission !== 'granted') {
        console.warn('Screen recording permission not granted:', permission);
        return;
      }

      const sources = await window.electronAPI?.getDesktopSources();
      if (sources && sources.length > 0) {
        const sourceId = sources[0].id;

        // Create a proper MediaStream from the Electron desktop source
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
            }
          } as any
        });

        const detectedRect = await detectChessBoard(stream);
        if (detectedRect) {
          setBoardRect(detectedRect);
        }
      }
    } catch (error) {
      console.error('Error during board detection:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div
      className="w-full h-full"
      style={{ background: 'transparent' }}
    >
      {isHudVisible ? (
        <div className="relative w-full h-full">
          {isWidgetSettingsOpen && (
            <WidgetSettings
              config={widgetConfig}
              onConfigChange={setWidgetConfig}
              onClose={() => setIsWidgetSettingsOpen(false)}
            />
          )}
          <TransparentOverlay
            engineStatus={engineStatus}
            depth={aiDepth}
            nodesPerSecond={1250000}
            score={currentScore}
            bestMove={bestMove}
            topMoves={topMoves}
            autoMoveEnabled={autoMoveEnabled}
            onAutoMoveChange={setAutoMoveEnabled}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onWidgetSettingsClick={() => setIsWidgetSettingsOpen(true)}
            onMinimizeClick={handleMinimize}
            widgetConfig={widgetConfig}
          />
        </div>
      ) : (
        <MinimizedButton
          onClick={handleExpand}
          onSettingsClick={() => {
            handleExpand();
            setIsSettingsOpen(true);
          }}
        />
      )}

      <SettingsControl
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoMoveEnabled={autoMoveEnabled}
        onAutoMoveChange={setAutoMoveEnabled}
        aiDepth={aiDepth}
        onAiDepthChange={setAiDepth}
        humanDelay={humanDelay}
        onHumanDelayChange={setHumanDelay}
      />
    </div>
  );
}
