import React, { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Chess } from "chess.js";
import { recognizeFen } from "../../utils/board-recognition";
import { stockfishEngine } from "../../utils/stockfish";

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
  const [scanInterval, setScanInterval] = useState(2000); // 체스판 스캔 간격
  const [myColor, setMyColor] = useState<"w" | "b">("w"); // 내 색깔
  const logEndRef = useRef<HTMLDivElement>(null);
  const chessRef = useRef(new Chess());
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFenRef = useRef<string>("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSetBoardArea = async () => {
    setIsSettingBoard(true);
    setStatus("체스판 좌상단 (a8) 코너를 클릭하세요...");
    addLog("체스판 영역 설정 시작");
    addLog("💡 체스판의 좌상단 (a8 칸) 중심을 마우스로 클릭하세요");

    try {
      // 사용자가 클릭할 때까지 대기
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const topLeft = await invoke<Position>("get_mouse_position");
      addLog(`✓ 좌상단 (a8): (${topLeft.x}, ${topLeft.y})`);
      setStatus("체스판 우하단 (h1) 코너를 클릭하세요...");
      addLog("💡 체스판의 우하단 (h1 칸) 중심을 마우스로 클릭하세요");

      await new Promise((resolve) => setTimeout(resolve, 3000));

      const bottomRight = await invoke<Position>("get_mouse_position");
      addLog(`✓ 우하단 (h1): (${bottomRight.x}, ${bottomRight.y})`);

      const width = bottomRight.x - topLeft.x;
      const height = bottomRight.y - topLeft.y;
      addLog(`체스판 크기: ${width}x${height} 픽셀`);

      if (width < 200 || height < 200) {
        addLog("⚠️ 체스판이 너무 작습니다. 다시 설정하세요.");
        setStatus("체스판이 너무 작습니다");
        setIsSettingBoard(false);
        return;
      }

      setBoardArea({ topLeft, bottomRight });
      setStatus("✓ 체스판 영역 설정 완료!");
      addLog("✅ 체스판 영역 설정 완료");
      setIsSettingBoard(false);
    } catch (error) {
      addLog(`❌ 오류: ${error}`);
      setStatus("오류 발생");
      setIsSettingBoard(false);
    }
  };

  const getSquarePosition = (square: string): Position => {
    if (!boardArea) throw new Error("체스판 영역이 설정되지 않았습니다");

    // 백 시점 기준: a1=좌하단, h8=우상단
    // 하지만 우리가 설정한 좌표는 a8=좌상단, h1=우하단
    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = parseInt(square[1]); // 1, 2, 3, ..., 8

    const boardWidth = boardArea.bottomRight.x - boardArea.topLeft.x;
    const boardHeight = boardArea.bottomRight.y - boardArea.topLeft.y;

    const squareWidth = boardWidth / 8;
    const squareHeight = boardHeight / 8;

    // a8이 topLeft이므로:
    // x: a=0, h=7 (왼쪽에서 오른쪽)
    // y: rank 8=0, rank 1=7 (위에서 아래)
    const x = Math.round(boardArea.topLeft.x + (file + 0.5) * squareWidth);
    const y = Math.round(boardArea.topLeft.y + (8 - rank + 0.5) * squareHeight);

    addLog(`📍 ${square} 좌표: (${x}, ${y}) [파일=${file}, 랭크=${rank}]`);
    return { x, y };
  };

  const executeMove = async (move: string) => {
    if (!boardArea) {
      addLog("체스판 영역이 설정되지 않았습니다");
      return;
    }

    try {
      // move 형식: e2e4 또는 e2e4q (프로모션)
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);

      addLog(`🎯 이동 준비: ${from} → ${to}`);
      
      const fromPos = getSquarePosition(from);
      const toPos = getSquarePosition(to);

      addLog(`🖱️ 드래그 앤 드롭 실행: (${fromPos.x}, ${fromPos.y}) → (${toPos.x}, ${toPos.y})`);
      setStatus(`이동 중: ${from} → ${to}`);

      // 드래그 앤 드롭 실행
      const result = await invoke<string>("execute_chess_move", {
        moveCmd: {
          from: fromPos,
          to: toPos,
        },
      });

      addLog(`✅ ${result}`);
      setStatus("✅ 이동 완료");
      
      // 이동 후 충분한 대기 시간
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      addLog(`❌ 이동 실행 오류: ${error}`);
      setStatus("이동 실패");
    }
  };

  // 체스판 실시간 감지 및 자동 플레이
  const autoPlayLoop = async () => {
    if (!boardArea) {
      addLog("❌ 체스판 영역이 설정되지 않았습니다");
      return;
    }

    try {
      // 1. 체스판 스크린샷 찍고 FEN 인식
      setStatus("🔍 체스판 스캔 중...");
      const result = await recognizeFen(boardArea);
      
      if (!result.fen) {
        addLog("⚠️ FEN 인식 실패");
        setStatus("⚠️ FEN 인식 실패");
        return;
      }

      const detectedFen = result.fen;
      
      // 2. FEN이 변경되었는지 확인 (포지션만 비교, 턴 정보 제외)
      const currentPos = detectedFen.split(' ')[0]; // 기물 배치만
      const lastPos = lastFenRef.current.split(' ')[0];
      
      if (currentPos === lastPos) {
        setStatus("⏳ 대기 중... (변화 없음)");
        return;
      }

      addLog(`📸 체스판 변화 감지!`);
      addLog(`   이전: ${lastPos}`);
      addLog(`   현재: ${currentPos}`);
      
      lastFenRef.current = detectedFen;
      setCurrentFen(detectedFen);
      
      let chess;
      try {
        chess = new Chess(detectedFen);
      } catch (e) {
        addLog(`❌ 유효하지 않은 FEN: ${e}`);
        return;
      }
      chessRef.current = chess;

      // 3. 내 턴인지 확인
      const currentTurn = chess.turn();
      addLog(`🎲 현재 턴: ${currentTurn === 'w' ? '백' : '흑'}, 내 색: ${myColor === 'w' ? '백' : '흑'}`);
      
      if (currentTurn !== myColor) {
        setStatus(`⏳ 상대 턴 대기 중... (${currentTurn === 'w' ? '백' : '흑'})`);
        addLog(`⏸ 상대 턴입니다 - 대기`);
        return;
      }

      // 4. 내 턴이면 Stockfish로 최선의 수 분석
      addLog(`🤔 내 턴! Stockfish 분석 시작...`);
      setStatus("🧠 Stockfish 분석 중...");
      setIsAnalyzing(true);

      const bestMoveStr = await stockfishEngine.getBestMove(detectedFen, 15);
      
      if (!bestMoveStr || bestMoveStr.length < 4) {
        addLog("❌ 최선의 수를 찾지 못했습니다");
        setIsAnalyzing(false);
        return;
      }

      setBestMove(bestMoveStr);
      const eval = await stockfishEngine.getEvaluation(detectedFen, 10);
      setEvaluation(eval);
      
      addLog(`✅ 최선의 수: ${bestMoveStr} (평가: ${eval > 0 ? '+' : ''}${eval.toFixed(2)})`);
      
      // 5. 자동으로 이동 실행
      setStatus(`♟️ 이동 실행: ${bestMoveStr}`);
      await executeMove(bestMoveStr);
      
      // 6. 이동 후 FEN 업데이트 (내가 둔 후 상태)
      try {
        chess.move(bestMoveStr);
        lastFenRef.current = chess.fen();
        addLog(`📝 FEN 업데이트: ${chess.fen().split(' ')[0]}`);
      } catch (e) {
        addLog(`⚠️ FEN 업데이트 실패: ${e}`);
      }
      
      setIsAnalyzing(false);
      setStatus("✅ 이동 완료! 상대 턴 대기...");
      addLog(`⏳ 이동 완료 - 상대 차례 대기 중`);
      
    } catch (error) {
      addLog(`❌ 오류: ${error}`);
      setStatus("오류 발생");
      setIsAnalyzing(false);
    }
  };

  const handleAutoMove = async () => {
    if (!boardArea) {
      addLog("❌ 먼저 체스판 영역을 설정하세요");
      return;
    }

    if (!autoMoveEnabled) {
      // 자동 플레이 시작
      setAutoMoveEnabled(true);
      addLog("🚀 자동 플레이 시작!");
      addLog(`⚙️ 스캔 간격: ${scanInterval}ms`);
      addLog(`🎨 내 색깔: ${myColor === 'w' ? '백' : '흑'}`);
      
      // 즉시 한 번 실행
      autoPlayLoop();
      
      // 주기적으로 실행
      autoPlayIntervalRef.current = setInterval(() => {
        if (!isAnalyzing) {
          autoPlayLoop();
        }
      }, scanInterval);
      
    } else {
      // 자동 플레이 중지
      setAutoMoveEnabled(false);
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
      addLog("⏸ 자동 플레이 중지");
      setStatus("중지됨");
    }
  };

  // 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, []);

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
            🤖 실시간 체스 자동 플레이어
          </div>
          <div className="text-xs text-white/60">
            체스판을 실시간으로 감지하고 내 턴에 자동으로 최선의 수를 둡니다
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

            {boardArea && (
              <div
                className="rounded-lg p-2 text-xs font-mono"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.25)", color: "rgba(255, 255, 255, 0.7)" }}
              >
                <div>a8 (좌상): ({boardArea.topLeft.x}, {boardArea.topLeft.y})</div>
                <div>h1 (우하): ({boardArea.bottomRight.x}, {boardArea.bottomRight.y})</div>
                <div>크기: {boardArea.bottomRight.x - boardArea.topLeft.x} × {boardArea.bottomRight.y - boardArea.topLeft.y}</div>
              </div>
            )}

            {boardArea && (
              <button
                onClick={async () => {
                  addLog("🧪 좌표 테스트 시작");
                  const testSquares = ["a8", "e8", "h8", "a1", "e1", "h1", "e2", "e4"];
                  for (const sq of testSquares) {
                    const pos = getSquarePosition(sq);
                    await new Promise(r => setTimeout(r, 500));
                  }
                  addLog("✅ 좌표 테스트 완료");
                }}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: "rgba(156, 163, 175, 0.5)",
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                🧪 좌표 테스트
              </button>
            )}

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
              {autoMoveEnabled ? "⏸ 자동 플레이 중지" : "🚀 자동 플레이 시작"}
            </button>

            <div className="space-y-2">
              <label className="text-xs text-white/70">내 색깔</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMyColor("w")}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: myColor === "w" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)",
                    color: "rgba(255, 255, 255, 0.95)",
                    border: myColor === "w" ? "2px solid rgba(255, 255, 255, 0.5)" : "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  ♔ 백
                </button>
                <button
                  onClick={() => setMyColor("b")}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: myColor === "b" ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.2)",
                    color: "rgba(255, 255, 255, 0.95)",
                    border: myColor === "b" ? "2px solid rgba(255, 255, 255, 0.5)" : "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  ♚ 흑
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/70">체스판 스캔 간격 (ms)</label>
              <input
                type="range"
                min="1000"
                max="5000"
                step="500"
                value={scanInterval}
                onChange={(e) => setScanInterval(parseInt(e.target.value))}
                className="w-full"
                disabled={autoMoveEnabled}
              />
              <div className="text-xs text-white/70">{scanInterval}ms (체스판 감지 주기)</div>
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
