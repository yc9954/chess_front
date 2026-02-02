import { useState, useEffect } from 'react';
import { ChessBoard } from '@/app/components/ChessBoard';
import { TransparentOverlay } from '@/app/components/TransparentOverlay';

export default function App() {
  const [isRunning, setIsRunning] = useState(true);
  const [evaluation, setEvaluation] = useState(1.2);
  const [bestMove, setBestMove] = useState('Nf3');
  const [depth, setDepth] = useState(18);
  const [winRate, setWinRate] = useState(62);

  // Simulate live engine updates
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setEvaluation(prev => prev + (Math.random() - 0.5) * 0.3);
      setDepth(prev => Math.min(25, prev + (Math.random() > 0.7 ? 1 : 0)));
      setWinRate(prev => Math.min(99, Math.max(1, prev + (Math.random() - 0.5) * 2)));
      
      if (Math.random() > 0.9) {
        const moves = ['Nf3', 'e4', 'Qd4', 'Bc4', 'O-O', 'Rd1', 'Ng5', 'h4'];
        setBestMove(moves[Math.floor(Math.random() * moves.length)]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8"
      style={{
        aspectRatio: '12 / 9',
        maxHeight: '100vh',
      }}
    >
      {/* Background texture */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Container with 12:9 aspect ratio */}
      <div 
        className="relative w-full max-w-7xl mx-auto"
        style={{
          aspectRatio: '12 / 9',
        }}
      >
        <div className="flex gap-6 h-full">
          {/* Chess Board - Left Side */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <ChessBoard />
          </div>

          {/* Transparent Overlay - Right Side */}
          <div className="flex-1 min-w-0">
            <TransparentOverlay
              bestMove={bestMove}
              evaluation={evaluation}
              depth={depth}
              winRate={winRate}
              isRunning={isRunning}
              onToggleRun={() => setIsRunning(!isRunning)}
            />
          </div>
        </div>
      </div>

      {/* Ambient light effects */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
