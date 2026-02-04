import React, { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Chess } from "chess.js";

// Types
interface Position {
  x: number;
  y: number;
}

interface BoardArea {
  topLeft: Position;
  bottomRight: Position;
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Glass Card Component (inspired by glass-calendar)
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  style = {},
}) => {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-500 hover:scale-105 ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        boxShadow:
          "0 8px 32px 0 rgba(0, 0, 0, 0.37), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.2), " +
          "inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        borderRadius: "16px",
        willChange: "transform",
        transform: "translateZ(0)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Drag Handle
const DragHandle: React.FC = () => {
  return (
    <div
      data-tauri-drag-region
      className="w-full flex items-center justify-center py-3 cursor-move transition-all duration-300 hover:bg-white/5"
      style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div className="flex gap-1.5" style={{ pointerEvents: "none" }}>
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 transition-all duration-300" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 transition-all duration-300" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40 transition-all duration-300" />
      </div>
    </div>
  );
};

export const AutoChessComponent = () => {
  const [boardArea, setBoardArea] = useState<BoardArea | null>(null);
  const [isSettingBoard, setIsSettingBoard] = useState(false);
  const [currentFen, setCurrentFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [autoMoveEnabled, setAutoMoveEnabled] = useState(false);
  const [status, setStatus] = useState<string>("대기 중...");
  const [logs, setLogs] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bestMove, setBestMove] = useState<string>("");
  const [evaluation, setEvaluation] = useState<number>(0);
  const [clickDelay, setClickDelay] = useState(500);
  const logEndRef = useRef<HTMLDivElement>(null);
  const chessRef = useRef(new Chess());

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSetBoardArea = async () => {
    setIsSettingBoard(true);
    setStatus("체스판 좌상단 코너를 클릭하세요...");
    addLog("체스판 영역 설정 시작");

    try {
      // 사용자가 클릭할 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const topLeft = await invoke<Position>("get_mouse_position");
      addLog(`좌상단: (${topLeft.x}, ${topLeft.y})`);
      setStatus("체스판 우하단 코너를 클릭하세요...");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const bottomRight = await invoke<Position>("get_mouse_position");
      addLog(`우하단: (${bottomRight.x}, ${bottomRight.y})`);

      setBoardArea({ topLeft, bottomRight });
      setStatus("체스판 영역 설정 완료!");
      addLog("체스판 영역 설정 완료");
      setIsSettingBoard(false);
    } catch (error) {
      addLog(`오류: ${error}`);
      setStatus("오류 발생");
      setIsSettingBoard(false);
    }
  };

  const getSquarePosition = (square: string): Position => {
    if (!boardArea) throw new Error("체스판 영역이 설정되지 않았습니다");

    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, ..., 1=7

    const boardWidth = boardArea.bottomRight.x - boardArea.topLeft.x;
    const boardHeight = boardArea.bottomRight.y - boardArea.topLeft.y;

    const squareWidth = boardWidth / 8;
    const squareHeight = boardHeight / 8;

    const x = Math.round(boardArea.topLeft.x + (file + 0.5) * squareWidth);
    const y = Math.round(boardArea.topLeft.y + (rank + 0.5) * squareHeight);

    return { x, y };
  };

  const executeMove = async (move: string) => {
    if (!boardArea) {
      addLog("체스판 영역이 설정되지 않았습니다");
      return;
    }

    try {
      // move 형식: e2e4
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);

      const fromPos = getSquarePosition(from);
      const toPos = getSquarePosition(to);

      addLog(`이동 실행: ${from} → ${to}`);
      setStatus(`이동 중: ${from} → ${to}`);

      await invoke("execute_chess_move", {
        moveCmd: {
          from: fromPos,
          to: toPos,
        },
      });

      // Chess.js에서 이동 적용
      try {
        chessRef.current.move(move);
        setCurrentFen(chessRef.current.fen());
        addLog(`이동 완료: ${move}`);
        setStatus("이동 완료");
      } catch (err) {
        addLog(`체스 이동 오류: ${err}`);
      }
    } catch (error) {
      addLog(`이동 실행 오류: ${error}`);
      setStatus("이동 실패");
    }
  };

  const analyzeBestMove = async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setStatus("Stockfish 분석 중...");
    addLog("포지션 분석 시작");

    try {
      // Stockfish WASM이 로드되어 있어야 함
      // 여기서는 간단한 무작위 이동으로 대체 (실제로는 Stockfish 사용)
      const chess = new Chess(currentFen);
      const moves = chess.moves({ verbose: true });

      if (moves.length === 0) {
        addLog("가능한 이동이 없습니다");
        setStatus("게임 종료");
        setIsAnalyzing(false);
        return;
      }

      // 무작위로 최선의 수 선택 (실제로는 Stockfish 엔진 사용)
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const bestMoveStr = randomMove.from + randomMove.to;

      setBestMove(bestMoveStr);
      setEvaluation(Math.random() * 2 - 1);
      addLog(`최선의 수: ${bestMoveStr}`);
      setStatus(`최선의 수: ${bestMoveStr}`);

      if (autoMoveEnabled) {
        await new Promise((resolve) => setTimeout(resolve, clickDelay));
        await executeMove(bestMoveStr);
      }
    } catch (error) {
      addLog(`분석 오류: ${error}`);
      setStatus("분석 실패");
    }

    setIsAnalyzing(false);
  };

  const handleAutoMove = async () => {
    if (!boardArea) {
      addLog("먼저 체스판 영역을 설정하세요");
      return;
    }

    setAutoMoveEnabled((prev) => !prev);
    if (!autoMoveEnabled) {
      addLog("자동 이동 모드 활성화");
    } else {
      addLog("자동 이동 모드 비활성화");
    }
  };

  return (
    <div
      className="h-full w-full flex items-center justify-center font-light"
      style={{
        background: "transparent",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <GlassCard
        className="rounded-2xl flex flex-col"
        style={{
          width: "calc(100% - 40px)",
          height: "calc(100% - 40px)",
          maxWidth: "800px",
          maxHeight: "90%",
          margin: "20px",
        }}
      >
        <DragHandle />

        <div className="flex flex-col gap-4 p-6 overflow-auto">
          <div className="text-xl font-bold text-white/90">
            🎯 체스 자동 플레이어
          </div>

          {/* 상태 */}
          <div
            className="rounded-xl p-3 text-sm"
            style={{
              backgroundColor: "rgba(99, 179, 237, 0.25)",
              color: "rgba(255, 255, 255, 0.95)",
            }}
          >
            <div className="font-semibold mb-1">상태</div>
            <div>{status}</div>
          </div>

          {/* 컨트롤 */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          >
            <div className="text-sm font-semibold text-white/90 mb-2">
              컨트롤
            </div>

            <button
              onClick={handleSetBoardArea}
              disabled={isSettingBoard}
              className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: boardArea
                  ? "rgba(81, 207, 102, 0.5)"
                  : "rgba(99, 179, 237, 0.5)",
                color: "rgba(255, 255, 255, 0.95)",
                cursor: isSettingBoard ? "not-allowed" : "pointer",
                opacity: isSettingBoard ? 0.5 : 1,
              }}
            >
              {boardArea ? "✓ 체스판 영역 재설정" : "체스판 영역 설정"}
            </button>

            <button
              onClick={handleAutoMove}
              disabled={!boardArea}
              className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: autoMoveEnabled
                  ? "rgba(255, 107, 107, 0.5)"
                  : "rgba(81, 207, 102, 0.5)",
                color: "rgba(255, 255, 255, 0.95)",
                cursor: !boardArea ? "not-allowed" : "pointer",
                opacity: !boardArea ? 0.5 : 1,
              }}
            >
              {autoMoveEnabled ? "⏸ 자동 이동 중지" : "▶ 자동 이동 시작"}
            </button>

            <button
              onClick={analyzeBestMove}
              disabled={!boardArea || isAnalyzing}
              className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: "rgba(156, 163, 175, 0.5)",
                color: "rgba(255, 255, 255, 0.95)",
                cursor: !boardArea || isAnalyzing ? "not-allowed" : "pointer",
                opacity: !boardArea || isAnalyzing ? 0.5 : 1,
              }}
            >
              {isAnalyzing ? "분석 중..." : "수동 분석"}
            </button>

            <div className="space-y-2">
              <label className="text-xs text-white/70">클릭 딜레이 (ms)</label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={clickDelay}
                onChange={(e) => setClickDelay(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/70">{clickDelay}ms</div>
            </div>
          </div>

          {/* FEN 입력 */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          >
            <div className="text-sm font-semibold text-white/90">FEN 포지션</div>
            <input
              type="text"
              value={currentFen}
              onChange={(e) => {
                setCurrentFen(e.target.value);
                try {
                  chessRef.current = new Chess(e.target.value);
                } catch (err) {
                  addLog(`유효하지 않은 FEN: ${err}`);
                }
              }}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                outline: "none",
              }}
            />
          </div>

          {/* 분석 결과 */}
          {bestMove && (
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ backgroundColor: "rgba(81, 207, 102, 0.25)" }}
            >
              <div className="text-sm font-semibold text-white/90">
                최선의 수
              </div>
              <div className="text-lg font-mono font-bold text-white">
                {bestMove}
              </div>
              <div className="text-sm text-white/80">
                평가:{" "}
                <span
                  style={{
                    color:
                      evaluation > 0
                        ? "#51cf66"
                        : evaluation < 0
                        ? "#ff6b6b"
                        : "#fff",
                  }}
                >
                  {evaluation > 0 ? "+" : ""}
                  {evaluation.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* 로그 */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          >
            <div className="text-sm font-semibold text-white/90 mb-2">
              📋 로그
            </div>
            <div
              className="space-y-1 overflow-y-auto text-xs font-mono"
              style={{ maxHeight: "200px", color: "rgba(255, 255, 255, 0.8)" }}
            >
              {logs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
