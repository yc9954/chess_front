import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransparentOverlay } from '@/app/components/TransparentOverlay';

export interface AnalysisState {
  isRunning: boolean;
  evaluation: number;
  bestMove: string;
  depth: number;
  winRate: number;
  isAutoMove: boolean;
  delay: number;
  moves: MoveRecord[];
  winHistory: WinHistoryPoint[];
  elapsedTime: number;
}

export interface MoveRecord {
  number: number;
  white: string;
  black: string;
  evaluation: number;
}

export interface WinHistoryPoint {
  move: number;
  white: number;
  black: number;
}

const INITIAL_MOVES: MoveRecord[] = [
  { number: 1, white: 'e4', black: 'c5', evaluation: 0.3 },
  { number: 2, white: 'Nf3', black: 'Nc6', evaluation: 0.4 },
  { number: 3, white: 'd4', black: 'cxd4', evaluation: 0.2 },
  { number: 4, white: 'Nxd4', black: 'Nf6', evaluation: 0.5 },
];

const INITIAL_WIN_HISTORY: WinHistoryPoint[] = [
  { move: 1, white: 52, black: 48 },
  { move: 2, white: 51, black: 49 },
  { move: 3, white: 53, black: 47 },
  { move: 4, white: 55, black: 45 },
  { move: 5, white: 58, black: 42 },
  { move: 6, white: 56, black: 44 },
  { move: 7, white: 59, black: 41 },
  { move: 8, white: 62, black: 38 },
];

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [state, setState] = useState<AnalysisState>({
    isRunning: true,
    evaluation: 1.2,
    bestMove: 'Nf3',
    depth: 18,
    winRate: 62,
    isAutoMove: false,
    delay: 500,
    moves: INITIAL_MOVES,
    winHistory: INITIAL_WIN_HISTORY,
    elapsedTime: 0,
  });

  // Simulate live engine updates
  useEffect(() => {
    if (!state.isRunning) return;

    const interval = setInterval(() => {
      setState(prev => {
        const newEval = prev.evaluation + (Math.random() - 0.5) * 0.3;
        const newDepth = Math.min(30, prev.depth + (Math.random() > 0.7 ? 1 : 0));
        const newWinRate = Math.min(99, Math.max(1, prev.winRate + (Math.random() - 0.5) * 2));

        const possibleMoves = ['Nf3', 'e4', 'Qd4', 'Bc4', 'O-O', 'Rd1', 'Ng5', 'h4', 'Bb5', 'd5'];
        const newBestMove = Math.random() > 0.9
          ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
          : prev.bestMove;

        return {
          ...prev,
          evaluation: newEval,
          depth: newDepth,
          winRate: newWinRate,
          bestMove: newBestMove,
          elapsedTime: prev.elapsedTime + 2,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [state.isRunning]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+X - toggle visibility
      if (e.ctrlKey && e.shiftKey && e.key === 'X') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
      // Ctrl+Shift+S - toggle analysis
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
      }
      // Ctrl+Shift+A - toggle auto-move
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setState(prev => ({ ...prev, isAutoMove: !prev.isAutoMove }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleRun = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const toggleAutoMove = useCallback(() => {
    setState(prev => ({ ...prev, isAutoMove: !prev.isAutoMove }));
  }, []);

  const setDelay = useCallback((delay: number) => {
    setState(prev => ({ ...prev, delay }));
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-stretch justify-end">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-[420px] min-h-screen flex-shrink-0"
          >
            <TransparentOverlay
              state={state}
              onToggleRun={toggleRun}
              onToggleAutoMove={toggleAutoMove}
              onDelayChange={setDelay}
              onToggleVisibility={toggleVisibility}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden toggle button when panel is hidden */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleVisibility}
            className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 backdrop-blur-xl flex items-center justify-center hover:bg-cyan-500/30 transition-colors"
            title="Show panel (Ctrl+Shift+X)"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Minimal ambient glow */}
      <div className="fixed top-0 right-0 w-[500px] h-full pointer-events-none opacity-30">
        <div className="absolute top-1/4 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />
      </div>
    </div>
  );
}
