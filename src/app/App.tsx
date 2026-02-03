import React, { useState, useEffect } from 'react';
import { TransparentOverlay } from '@/app/components/TransparentOverlay';
import { SettingsControl } from '@/app/components/SettingsControl';
import { MinimizedButton } from '@/app/components/MinimizedButton';
import { detectChessBoard } from '@/utils/boardDetection';
import { CalibrationFrame } from '@/app/components/CalibrationFrame';

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents: (ignore: boolean) => void;
      getDesktopSources: () => Promise<any[]>;
    };
  }
}

export default function App() {
  // UI State
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Engine State
  const [engineStatus, setEngineStatus] = useState<'idle' | 'analyzing' | 'ready'>('analyzing');
  const [currentScore, setCurrentScore] = useState(45); // centipawns
  const [aiDepth, setAiDepth] = useState(20);

  // Settings
  const [autoMoveEnabled, setAutoMoveEnabled] = useState(false);
  const [humanDelay, setHumanDelay] = useState(1000);

  // Mock data for demonstration
  const bestMove = 'Nf3';
  const topMoves = [
    { notation: 'Nf3', evaluation: 45, isBest: true },
    { notation: 'e4', evaluation: 32, centipawnLoss: 13 },
    { notation: 'd4', evaluation: 28, centipawnLoss: 17 },
  ];

  // Calibration State - Default to true to force calibration on start if not detected
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [boardRect, setBoardRect] = useState({ x: 100, y: 100, width: 600, height: 600 });
  const [isDetecting, setIsDetecting] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+H: Toggle HUD visibility
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setIsHudVisible((prev) => !prev);
      }

      // Ctrl+S: Toggle settings
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const confirmCalibration = () => {
    setIsCalibrating(false);
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouseEvents(true); // Passthrough to game
    }
  };

  const runScan = async () => {
    setIsDetecting(true);
    try {
      const sources = await window.electronAPI?.getDesktopSources();
      if (sources && sources.length > 0) {
        // Assuming the first source is the primary screen or the one we want to scan
        const sourceId = sources[0].id;
        const detectedRect = await detectChessBoard(sourceId);
        if (detectedRect) {
          setBoardRect(detectedRect);
        } else {
          console.log("No chessboard detected.");
        }
      }
    } catch (error) {
      console.error("Error during board detection:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    // Transparent background for Electron
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-transparent">

      {/* Board Calibration Frame */}
      {isCalibrating ? (
        <CalibrationFrame
          rect={boardRect}
          onChange={setBoardRect}
          onConfirm={confirmCalibration}
          onScan={runScan}
          isScanning={isDetecting}
        />
      ) : (
        // Static frame when not calibrating
        <div
          className="absolute border-4 border-dashed border-cyan-500/30 pointer-events-none rounded-lg transition-all duration-300"
          style={{
            left: boardRect.x,
            top: boardRect.y,
            width: boardRect.width,
            height: boardRect.height
          }}
        />
      )}

      {/* Transparent Overlay UI */}
      {isHudVisible && (
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
          onMinimizeClick={() => setIsHudVisible(false)}
        />
      )}

      {/* Minimized Button */}
      {!isHudVisible && (
        <MinimizedButton
          onClick={() => setIsHudVisible(true)}
          onSettingsClick={() => {
            setIsSettingsOpen(true);
            setIsHudVisible(true);
          }}
        />
      )}

      {/* Settings Modal (outside main container) */}
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