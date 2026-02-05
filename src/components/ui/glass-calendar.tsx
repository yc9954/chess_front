import * as React from "react";
import { invoke } from "@tauri-apps/api/core";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { Chess } from "chess.js";
import { recognizeFen } from "../../utils/board-recognition";
import { stockfishEngine } from "../../utils/stockfish";
import { cn } from "../../lib/utils";

// --- TYPE DEFINITIONS ---
interface Position {
  x: number;
  y: number;
}

interface BoardArea {
  topLeft: Position;
  bottomRight: Position;
}

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// --- HELPER TO HIDE SCROLLBAR ---
const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

// --- MAIN COMPONENT ---
export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, ...props }, ref) => {
    const appWindow = React.useMemo(() => getCurrentWindow(), []);
    const [boardArea, setBoardArea] = React.useState<BoardArea | null>(null);
    const [currentFen, setCurrentFen] = React.useState(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
    const [autoMoveEnabled, setAutoMoveEnabled] = React.useState(false);
    const [status, setStatus] = React.useState("대기 중...");
    const [logs, setLogs] = React.useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [bestMove, setBestMove] = React.useState("");
    const [evaluation, setEvaluation] = React.useState(0);
    const [clickDelay, setClickDelay] = React.useState(1000);
    const [debugImage, setDebugImage] = React.useState<string | null>(null);
    const [areaOffsetX, setAreaOffsetX] = React.useState(0);
    const [areaOffsetY, setAreaOffsetY] = React.useState(0);
    const [areaScale, setAreaScale] = React.useState(1);
    const [myColor, setMyColor] = React.useState<"w" | "b">("w");
    const [boardFlipped, setBoardFlipped] = React.useState(false); // 체스판 뒤집힘 여부
    const [isManualSetup, setIsManualSetup] = React.useState(false);
    const [manualCorner, setManualCorner] = React.useState<"topLeft" | "bottomRight" | null>(null);
    const [lockBoardArea, setLockBoardArea] = React.useState(false); // 체스판 영역 고정
    const logEndRef = React.useRef<HTMLDivElement>(null);
    const chessRef = React.useRef(new Chess());
    const autoMoveWarnedRef = React.useRef(false);
    const recognizingRef = React.useRef(false);
    const lastFailureRef = React.useRef(0);
    const lastFenRef = React.useRef("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const stableAreaRef = React.useRef<BoardArea | null>(null);
    const candidateAreaRef = React.useRef<{ area: BoardArea; count: number } | null>(
      null
    );

    // 로그 자동 스크롤 제거 - 사용자가 직접 스크롤하도록
    // React.useEffect(() => {
    //   logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [logs]);

    React.useEffect(() => {
      const ensureInteractive = async () => {
        try {
          await appWindow.setIgnoreCursorEvents(false);
        } catch (error) {
          addLog(`클릭 설정 오류: ${error}`);
        }
      };

      ensureInteractive();
    }, [appWindow]);

    React.useEffect(() => {
      const unsubscribe = stockfishEngine.addListener((message) => {
        if (
          message.includes("uciok") ||
          message.includes("readyok") ||
          message.startsWith("bestmove")
        ) {
          addLog(`Stockfish: ${message}`);
        }
      });
      return () => unsubscribe();
    }, []);



    const addLog = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    };

    const isAreaSimilar = (a: BoardArea, b: BoardArea) => {
      const aw = a.bottomRight.x - a.topLeft.x;
      const ah = a.bottomRight.y - a.topLeft.y;
      const bw = b.bottomRight.x - b.topLeft.x;
      const bh = b.bottomRight.y - b.topLeft.y;
      const acx = a.topLeft.x + aw / 2;
      const acy = a.topLeft.y + ah / 2;
      const bcx = b.topLeft.x + bw / 2;
      const bcy = b.topLeft.y + bh / 2;
      const dist = Math.hypot(acx - bcx, acy - bcy);
      const size = Math.max(1, Math.max(aw, ah));
      const sizeRatio = (bw * bh) / Math.max(1, aw * ah);
      return dist < size * 0.15 && sizeRatio > 0.7 && sizeRatio < 1.4;
    };

    const stabilizeArea = (nextArea: BoardArea | null) => {
      if (!nextArea) return null;
      const stable = stableAreaRef.current;
      if (!stable || isAreaSimilar(stable, nextArea)) {
        stableAreaRef.current = nextArea;
        candidateAreaRef.current = null;
        setBoardArea(nextArea);
        return nextArea;
      }

      const candidate = candidateAreaRef.current;
      if (candidate && isAreaSimilar(candidate.area, nextArea)) {
        const count = candidate.count + 1;
        candidateAreaRef.current = { area: nextArea, count };
        if (count >= 2) {
          stableAreaRef.current = nextArea;
          candidateAreaRef.current = null;
          setBoardArea(nextArea);
          return nextArea;
        }
      } else {
        candidateAreaRef.current = { area: nextArea, count: 1 };
      }
      return stable;
    };

    const applyCalibration = React.useCallback(
      (area: BoardArea | null): BoardArea | null => {
        if (!area) return null;
        const width = area.bottomRight.x - area.topLeft.x;
        const height = area.bottomRight.y - area.topLeft.y;
        const centerX = area.topLeft.x + width / 2;
        const centerY = area.topLeft.y + height / 2;
        const nextWidth = width * areaScale;
        const nextHeight = height * areaScale;
        const left = Math.round(centerX - nextWidth / 2 + areaOffsetX);
        const top = Math.round(centerY - nextHeight / 2 + areaOffsetY);
        return {
          topLeft: { x: left, y: top },
          bottomRight: {
            x: Math.round(left + nextWidth),
            y: Math.round(top + nextHeight),
          },
        };
      },
      [areaOffsetX, areaOffsetY, areaScale]
    );

    const buildOverlayImage = React.useCallback(
      async (base64: string, area: BoardArea | null): Promise<string> => {
        console.log(" buildOverlayImage 시작");
        const dataUrl = `data:image/png;base64,${base64}`;
        if (!area) {
          console.log(" area가 null");
          addLog(" buildOverlayImage: area가 null");
          return dataUrl;
        }

        console.log(" Area:", area);
        addLog(` 체스판 영역: (${area.topLeft.x},${area.topLeft.y}) → (${area.bottomRight.x},${area.bottomRight.y})`);

        return await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            console.log(" 이미지 로드 완료:", img.naturalWidth, "x", img.naturalHeight);
            
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              console.log(" Canvas context 생성 실패");
              resolve(dataUrl);
              return;
            }
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0);
            console.log(" 이미지 그리기 완료");
            
            const width = area.bottomRight.x - area.topLeft.x;
            const height = area.bottomRight.y - area.topLeft.y;
            
            console.log(` 체스판 크기: ${width} x ${height}`);
            addLog(` 체스판: ${width}×${height}px, 칸: ${(width/8).toFixed(1)}px`);
            
            // 외곽선 (녹색 - 매우 굵게)
            console.log(" 녹색 외곽선 그리기...");
            ctx.strokeStyle = "#00ff00"; // 순수 녹색
            ctx.lineWidth = 8;
            ctx.strokeRect(area.topLeft.x, area.topLeft.y, width, height);
            
            const squareWidth = width / 8;
            const squareHeight = height / 8;
            
            // 8x8 그리드 그리기 (노란색 - 더 잘 보이게)
            console.log("🟡 노란색 그리드 그리기...");
            ctx.strokeStyle = "#ffff00"; // 순수 노란색
            ctx.lineWidth = 4;
            
            // 세로선
            for (let i = 1; i < 8; i++) {
              const x = area.topLeft.x + i * squareWidth;
              ctx.beginPath();
              ctx.moveTo(x, area.topLeft.y);
              ctx.lineTo(x, area.bottomRight.y);
              ctx.stroke();
              console.log(`  세로선 ${i}: x=${x}`);
            }
            
            // 가로선
            for (let i = 1; i < 8; i++) {
              const y = area.topLeft.y + i * squareHeight;
              ctx.beginPath();
              ctx.moveTo(area.topLeft.x, y);
              ctx.lineTo(area.bottomRight.x, y);
              ctx.stroke();
              console.log(`  가로선 ${i}: y=${y}`);
            }
            
            // 코너 라벨 (빨간색 - 크게)
            console.log(" 라벨 그리기...");
            ctx.font = "bold 30px Arial";
            
            const labels = [
              { text: "a8", x: area.topLeft.x + 10, y: area.topLeft.y + 40 },
              { text: "h8", x: area.bottomRight.x - 50, y: area.topLeft.y + 40 },
              { text: "a1", x: area.topLeft.x + 10, y: area.bottomRight.y - 10 },
              { text: "h1", x: area.bottomRight.x - 50, y: area.bottomRight.y - 10 },
            ];
            
            labels.forEach(label => {
              // 배경
              ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
              ctx.fillRect(label.x - 5, label.y - 30, 50, 40);
              // 텍스트
              ctx.fillStyle = "#ff0000"; // 순수 빨간색
              ctx.fillText(label.text, label.x, label.y);
              console.log(`  라벨: ${label.text} at (${label.x}, ${label.y})`);
            });
            
            console.log(" 모든 그리기 완료");
            addLog(" 그리드 오버레이 완료 (녹색 외곽, 노란색 그리드, 빨간색 라벨)");
            
            const finalDataUrl = canvas.toDataURL("image/png");
            console.log(" DataURL 생성 완료, 길이:", finalDataUrl.length);
            resolve(finalDataUrl);
          };
          
          img.onerror = (err) => {
            console.log(" 이미지 로딩 실패:", err);
            addLog(" 이미지 로딩 실패");
            resolve(dataUrl);
          };
          
          img.src = dataUrl;
          console.log(" 이미지 로딩 대기 중...");
        });
      },
      [addLog]
    );

    const refreshFenFromApi = async () => {
      if (recognizingRef.current) return null;
      const now = Date.now();
      if (now - lastFailureRef.current < 1500) return null;
      recognizingRef.current = true;
      setStatus("보드 인식 중...");
      try {
        // Always capture fullscreen for auto recognition
        const result = await recognizeFen(null);
        if (!result.fen) {
          addLog("인식 API 응답에 FEN이 없습니다");
          setStatus("인식 실패");
          return null;
        }

        try {
          chessRef.current.load(result.fen);
          setCurrentFen(result.fen);
          let areaForUse: BoardArea | null = result.boardArea || boardArea;
          if (result.boardArea) {
            // 체스판 영역이 고정되어 있으면 새로운 영역 무시
            if (lockBoardArea && boardArea) {
              areaForUse = boardArea;
              addLog(` 체스판 영역 고정됨 (새 영역 무시)`);
            } else {
              const stabilized = stabilizeArea(result.boardArea);
              if (stabilized) {
                areaForUse = stabilized;
                const width = stabilized.bottomRight.x - stabilized.topLeft.x;
                const height = stabilized.bottomRight.y - stabilized.topLeft.y;
                addLog(
                  ` 인식 영역: (${stabilized.topLeft.x}, ${stabilized.topLeft.y}) → (${stabilized.bottomRight.x}, ${stabilized.bottomRight.y}) [${width}×${height}]`
                );
              }
            }
          } else if (!boardArea) {
            const fallback = await resolveFallbackBoardArea();
            if (fallback) {
              areaForUse = stabilizeArea(fallback);
              addLog(
                `임시 영역 사용: (${fallback.topLeft.x}, ${fallback.topLeft.y}) → (${fallback.bottomRight.x}, ${fallback.bottomRight.y})`
              );
            }
          }
          if (result.debugInfo) {
            addLog(`탐색 방식: ${result.debugInfo.method || "unknown"}`);
            if (result.debugInfo.details) {
              addLog(`탐색 상세: ${JSON.stringify(result.debugInfo.details)}`);
            }
          }
          if (result.debugImagePath) {
            addLog(`인식 이미지 저장됨: ${result.debugImagePath}`);
          } else if (result.debugImageBase64) {
            addLog(`인식 이미지(base64) 수신됨 (${result.debugImageBase64.length})`);
          } else {
            addLog("인식 이미지 없음");
          }
            if (result.debugImageBase64) {
              // applyCalibration 직접 적용하지 말고 원본 area 사용
              addLog(` 오버레이용 영역: (${areaForUse?.topLeft.x},${areaForUse?.topLeft.y}) ~ (${areaForUse?.bottomRight.x},${areaForUse?.bottomRight.y})`);
              const overlay = await buildOverlayImage(
                result.debugImageBase64,
                areaForUse
              );
              setDebugImage(overlay);
            }
          addLog(
            `보드 인식 완료 (area=${result.boardArea ? "set" : "null"})`
          );
          setStatus("인식 완료");
          return result.fen;
        } catch (err) {
          addLog(`FEN 파싱 실패: ${err}`);
          setStatus("인식 실패");
          return null;
        }
      } catch (error) {
        addLog(`인식 오류: ${error}`);
        setStatus("인식 실패");
        lastFailureRef.current = Date.now();
        return null;
      } finally {
        recognizingRef.current = false;
      }
    };

    const resolveFallbackBoardArea = async (): Promise<BoardArea | null> => {
      try {
        const monitor = await currentMonitor();
        if (!monitor) return null;
        const size = monitor.size;
        const position = monitor.position;
        const boardSize = Math.floor(Math.min(size.width, size.height) * 0.6);
        const left = Math.floor(position.x + (size.width - boardSize) / 2);
        const top = Math.floor(position.y + (size.height - boardSize) / 2);
        return {
          topLeft: { x: left, y: top },
          bottomRight: { x: left + boardSize, y: top + boardSize },
        };
      } catch (error) {
        // Fallback to browser screen coords if Tauri permission blocks
        try {
          const boardSize = Math.floor(Math.min(window.screen.width, window.screen.height) * 0.6);
          const left = Math.floor((window.screen.width - boardSize) / 2);
          const top = Math.floor((window.screen.height - boardSize) / 2);
          return {
            topLeft: { x: left, y: top },
            bottomRight: { x: left + boardSize, y: top + boardSize },
          };
        } catch {
          addLog(`임시 영역 계산 실패: ${error}`);
          return null;
        }
      }
    };

    const [autoRecognize, setAutoRecognize] = React.useState(true);

    React.useEffect(() => {
      if (!autoRecognize) return;
      
      const autoPlayLoop = async () => {
        if (isAnalyzing) {
          addLog(" 분석 중... 다음 스캔 대기");
          return;
        }
        
        const fen = await refreshFenFromApi();
        
        if (!autoMoveEnabled || !fen) {
          return;
        }
        
        if (!boardArea) {
          if (!autoMoveWarnedRef.current) {
            addLog(" 자동 이동은 boardArea가 필요합니다");
            autoMoveWarnedRef.current = true;
          }
          return;
        }

        // FEN 변화 감지 (기물 배치만 비교)
        const currentPos = fen.split(' ')[0];
        const lastPos = lastFenRef.current.split(' ')[0];
        
        // 디버깅: 매번 FEN 확인
        if (Math.random() < 0.1) { // 10% 확률로만 로그 (스팸 방지)
          addLog(` FEN 확인: ${currentPos === lastPos ? '변화없음' : '변화감지!'}`);
        }
        
        if (currentPos === lastPos) {
          // 변화 없음 - 대기
          return;
        }

        addLog(`  체스판 변화 감지! `);
        addLog(`   이전: ${lastPos}`);
        addLog(`   현재: ${currentPos}`);
        lastFenRef.current = fen;

        // 내 턴인지 확인
        try {
          const chess = new Chess(fen);
          const currentTurn = chess.turn();
          addLog(` 현재 턴: ${currentTurn === 'w' ? '백' : '흑'}, 내 색: ${myColor === 'w' ? '백' : '흑'}`);
          
          if (currentTurn !== myColor) {
            addLog(`⏸ 상대 턴 - 대기`);
            return;
          }

          // 내 턴이면 분석 및 이동
          addLog(`🤔 내 턴! Stockfish 분석 시작...`);
          await analyzeBestMove(fen);
          
          // 이동 후 FEN 업데이트
          if (bestMove && bestMove.length >= 4) {
            try {
              chess.move(bestMove);
              lastFenRef.current = chess.fen();
              addLog(` 이동 완료 - 상대 턴 대기`);
            } catch (moveErr) {
              addLog(` 이동 업데이트 실패: ${moveErr}`);
            }
          }
          
        } catch (e) {
          addLog(` 체스 로직 오류: ${e}`);
        }
      };
      
      const interval = setInterval(autoPlayLoop, 2500);
      return () => clearInterval(interval);
    }, [autoRecognize, autoMoveEnabled, isAnalyzing, boardArea, myColor]);


    const getSquarePosition = (square: string): Position => {
      if (!boardArea) throw new Error("체스판 영역이 설정되지 않았습니다");
      
      // 미세 조정 적용
      const area = applyCalibration(boardArea);
      if (!area) throw new Error("Calibration 실패");

      let file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
      let rank = parseInt(square[1], 10); // 1, 2, 3, ..., 8

      const boardWidth = area.bottomRight.x - area.topLeft.x;
      const boardHeight = area.bottomRight.y - area.topLeft.y;

      const squareWidth = boardWidth / 8;
      const squareHeight = boardHeight / 8;

      let x, y;
      
      if (boardFlipped) {
        // 흑 시점 (뒤집힌 상태): a1=우상단, h8=좌하단
        x = Math.round(area.bottomRight.x - (file + 0.5) * squareWidth);
        y = Math.round(area.bottomRight.y - (rank - 0.5) * squareHeight);
      } else {
        // 백 시점 (정상): a8=좌상단, h1=우하단
        x = Math.round(area.topLeft.x + (file + 0.5) * squareWidth);
        y = Math.round(area.topLeft.y + (8 - rank + 0.5) * squareHeight);
      }
      
      return { x, y };
    };

    const executeMove = async (move: string) => {
      if (!boardArea) {
        addLog(" 체스판 영역이 설정되지 않았습니다");
        return;
      }

      try {
        const from = move.substring(0, 2);
        const to = move.substring(2, 4);

        addLog(` 이동 시작: ${from} → ${to} `);

        const fromPos = getSquarePosition(from);
        const toPos = getSquarePosition(to);

        addLog(` Rust로 전달: from=(${fromPos.x}, ${fromPos.y}) to=(${toPos.x}, ${toPos.y})`);
        addLog(`   이동 거리: ${Math.abs(toPos.x - fromPos.x)}px (가로), ${Math.abs(toPos.y - fromPos.y)}px (세로)`);
        setStatus(`이동 중: ${from} → ${to}`);

        const result = await invoke<string>("execute_chess_move", {
          moveCmd: {
            from: fromPos,
            to: toPos,
          },
        });

        addLog(` Rust 응답: ${result}`);
        setStatus(" 이동 완료");
        
        // 이동 후 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        addLog(` 이동 실행 오류: ${error}`);
        setStatus("이동 실패");
      }
    };

    const analyzeBestMove = async (fenOverride?: string) => {
      if (isAnalyzing) return;

      setIsAnalyzing(true);
      setStatus("Stockfish 분석 중...");
      addLog("포지션 분석 시작");

      try {
        const fenFromApi = fenOverride ? null : await refreshFenFromApi();
        const fenToAnalyze = fenOverride || fenFromApi || currentFen;
        const chess = new Chess(fenToAnalyze);
        const moves = chess.moves({ verbose: true });

        if (moves.length === 0) {
          addLog("가능한 이동이 없습니다");
          setStatus("게임 종료");
          return;
        }

        const bestMoveStr = await stockfishEngine.getBestMove(fenToAnalyze, 15);
        const score = await stockfishEngine.getEvaluation(fenToAnalyze, 15);

        if (!bestMoveStr) {
          const statusInfo = stockfishEngine.getStatus();
          addLog(
            `Stockfish 응답이 없습니다 (ready=${statusInfo.ready} engine=${statusInfo.hasEngine})`
          );
          if (statusInfo.lastError) {
            addLog(`Stockfish 오류: ${statusInfo.lastError}`);
          }
          setStatus("분석 실패");
          return;
        }

        setBestMove(bestMoveStr);
        setEvaluation(score);
        addLog(`추천 수: ${bestMoveStr}`);
        setStatus(`추천 수: ${bestMoveStr}`);

        if (autoMoveEnabled) {
          await new Promise((resolve) => setTimeout(resolve, clickDelay));
          await executeMove(bestMoveStr);
        }
      } catch (error) {
        addLog(`분석 오류: ${error}`);
        setStatus("분석 실패");
      } finally {
        setIsAnalyzing(false);
      }
    };

    const handleAutoMove = () => {
      setAutoMoveEnabled((prev) => !prev);
      if (!autoMoveEnabled) {
        addLog("자동 이동 모드 활성화");
      } else {
        addLog("자동 이동 모드 비활성화");
      }
    };

    const handleDragStart = async (
      event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      if ("button" in event && event.button !== 0) return;
      addLog("드래그 시작 시도");
      try {
        await appWindow.startDragging();
        addLog("드래그 시작 성공");
      } catch (error) {
        addLog(`드래그 실패: ${error}`);
      }
    };

    const dumpState = () => {
      addLog("━");
      addLog(" 상태 덤프");
      addLog("━");
      addLog(` 자동 인식: ${autoRecognize ? "ON " : "OFF "}`);
      addLog(` 자동 이동: ${autoMoveEnabled ? "ON " : "OFF "}`);
      addLog(` 내 색깔: ${myColor === 'w' ? '백 (White)' : '흑 (Black)'}`);
      addLog(` 체스판: ${boardArea ? `(${boardArea.topLeft.x},${boardArea.topLeft.y})-(${boardArea.bottomRight.x},${boardArea.bottomRight.y})` : " 없음"}`);
      addLog(` 분석 중: ${isAnalyzing ? "예 " : "아니오"}`);
      addLog(` 최선의 수: ${bestMove || "없음"}`);
      addLog(` 클릭 딜레이: ${clickDelay}ms`);
      addLog(` 현재 FEN: ${currentFen}`);
      addLog(` 마지막 FEN: ${lastFenRef.current}`);
      const isStartPos = currentFen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      addLog(` 포지션: ${isStartPos ? "시작 포지션 (아직 안 움직임)" : "게임 진행 중"}`);
      addLog("━");
    };

    return (
      <div
        ref={ref}
        className={cn(
          "pointer-events-auto w-full h-full rounded-3xl p-5 overflow-hidden flex flex-col",
          "bg-black/40 backdrop-blur-xl persistent-blur border border-white/10",
          "text-white font-sans cursor-grab active:cursor-grabbing",
          className
        )}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
        data-tauri-drag-region
        onPointerDown={handleDragStart}
        onMouseDown={handleDragStart}
        {...props}
      >
        <ScrollbarHide />
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-white/60">Chess Assist</p>
            <p className="text-sm font-bold text-white">{status}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">Best</p>
            <p className="text-sm font-semibold text-white">{bestMove || "-"}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3" onPointerDown={(e) => e.stopPropagation()}>
          <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <button
                onClick={() => refreshFenFromApi()}
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/20 cursor-pointer"
              >
                즉시 인식
              </button>
              <button
                onClick={() => setAutoRecognize((prev) => !prev)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                  autoRecognize
                    ? "bg-blue-500/30 text-white border border-blue-400/40"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                {autoRecognize ? "자동 ON" : "자동 OFF"}
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setIsManualSetup(true);
                  setManualCorner("topLeft");
                  addLog(" 수동 설정 시작 ");
                  addLog(" 체스판 좌상단(a8 칸)을 클릭하세요");
                  setStatus("좌상단(a8) 클릭 대기...");
                  
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  try {
                    const topLeft = await invoke<Position>("get_mouse_position");
                    addLog(`✓ 좌상단: (${topLeft.x}, ${topLeft.y})`);
                    
                    setManualCorner("bottomRight");
                    addLog(" 체스판 우하단(h1 칸)을 클릭하세요");
                    setStatus("우하단(h1) 클릭 대기...");
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const bottomRight = await invoke<Position>("get_mouse_position");
                    addLog(`✓ 우하단: (${bottomRight.x}, ${bottomRight.y})`);
                    
                    const newArea: BoardArea = { topLeft, bottomRight };
                    const width = bottomRight.x - topLeft.x;
                    const height = bottomRight.y - topLeft.y;
                    
                    addLog(`체스판 크기: ${width}×${height}`);
                    
                    if (width < 200 || height < 200) {
                      addLog(" 체스판이 너무 작습니다");
                    } else {
                      setBoardArea(newArea);
                      stableAreaRef.current = newArea;
                      setLockBoardArea(true);
                      addLog(" 수동 설정 완료! (영역 고정됨)");
                      setStatus(" 수동 설정 완료");
                    }
                  } catch (error) {
                    addLog(` 오류: ${error}`);
                    setStatus("설정 실패");
                  } finally {
                    setIsManualSetup(false);
                    setManualCorner(null);
                  }
                }}
                disabled={isManualSetup}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                  isManualSetup
                    ? "bg-white/10 text-white/50"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                {isManualSetup ? "설정 중..." : " 수동"}
              </button>
              
              {boardArea && (
                <button
                  onClick={() => {
                    setLockBoardArea(!lockBoardArea);
                    addLog(`${!lockBoardArea ? "" : ""} 체스판 영역 ${!lockBoardArea ? "고정" : "해제"}`);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    lockBoardArea
                      ? "bg-blue-500/30 text-white border border-blue-400/40"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  )}
                >
                  {lockBoardArea ? "" : ""}
                </button>
              )}
            </div>
          </div>
          <div onPointerDown={(e) => e.stopPropagation()}>
            <p className="text-[10px] text-white/40">
              자동 인식은 전체 화면을 주기적으로 캡처해 체스판을 찾고 FEN/영역을 갱신합니다
            </p>
            <p className="text-[10px] text-white/40">
              현재 영역:{" "}
              {boardArea
                ? `(${boardArea.topLeft.x},${boardArea.topLeft.y}) → (${boardArea.bottomRight.x},${boardArea.bottomRight.y})`
                : "없음"}
            </p>
          </div>

          <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <button
                onClick={() => analyzeBestMove()}
                disabled={!boardArea || isAnalyzing}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                  !boardArea || isAnalyzing
                    ? "bg-white/10 text-white/50"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                {isAnalyzing ? "분석 중..." : " 분석"}
              </button>
              <button
                onClick={async () => {
                  if (!boardArea) {
                    addLog(" 체스판 영역 없음");
                    return;
                  }
                  addLog("  테스트 이동 (e2→e4) ");
                  await executeMove("e2e4");
                }}
                disabled={!boardArea}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                  !boardArea
                    ? "bg-white/10 text-white/50"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                )}
              >
                 e2e4
              </button>
            </div>
            
            {boardArea && (
              <div className="space-y-1">
                <p className="text-[9px] text-white/50">그리드 테스트 (클릭하면 해당 칸으로 마우스 이동)</p>
                <div className="grid grid-cols-8 gap-[1px] text-[9px]">
                  {Array.from({ length: 8 }, (_, rank) =>
                    Array.from({ length: 8 }, (_, file) => {
                      const square = String.fromCharCode(97 + file) + (8 - rank);
                      const isCorner = ["a1", "h1", "a8", "h8"].includes(square);
                      return (
                        <button
                          key={square}
                          onClick={async () => {
                            addLog(` ${square} 테스트`);
                            const pos = getSquarePosition(square);
                            try {
                              await invoke("click_position", { x: pos.x, y: pos.y });
                            } catch (e) {
                              addLog(` ${e}`);
                            }
                          }}
                          className={cn(
                            "aspect-square flex items-center justify-center rounded font-mono cursor-pointer transition-colors",
                            isCorner
                              ? "bg-red-400/30 hover:bg-red-400/50 text-red-100 font-bold"
                              : (file + rank) % 2 === 0
                              ? "bg-white/20 hover:bg-white/30 text-white/90"
                              : "bg-white/10 hover:bg-white/20 text-white/70"
                          )}
                        >
                          {square}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-[8px] text-red-400/60">빨간색 = 코너 (a1, h1, a8, h8)</p>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-white/5 px-3 py-2" onPointerDown={(e) => e.stopPropagation()}>
            <p className="text-xs text-white/50 mb-2">설정</p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setMyColor("w")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                    myColor === "w"
                      ? "bg-white/30 text-white border-2 border-white/50"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                >
                   백
                </button>
                <button
                  onClick={() => setMyColor("b")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                    myColor === "b"
                      ? "bg-black/50 text-white border-2 border-white/50"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  )}
                >
                   흑
                </button>
              </div>
              
              <button
                onClick={() => {
                  setBoardFlipped(!boardFlipped);
                  addLog(` 체스판 방향: ${!boardFlipped ? "뒤집힘" : "정상"}`);
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-xs font-semibold transition-colors cursor-pointer",
                  boardFlipped
                    ? "bg-purple-400/30 text-purple-100 border-2 border-purple-400/50"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                 {boardFlipped ? "흑 시점 (뒤집힘)" : "백 시점 (정상)"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2" onPointerDown={(e) => e.stopPropagation()}>
            <div>
              <p className="text-xs text-white/50">Auto Move</p>
              <p className="text-sm font-semibold text-white">
                {autoMoveEnabled ? "ON" : "OFF"}
              </p>
            </div>
            <button
              onClick={handleAutoMove}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
                autoMoveEnabled
                  ? "bg-blue-500/30 text-white border border-blue-400/40"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              )}
            >
              {autoMoveEnabled ? "끄기" : "켜기"}
            </button>
          </div>


          <div className="rounded-lg bg-white/5 px-3 py-2" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50">Click Delay</p>
              <p className="text-xs text-white/80">{clickDelay} ms</p>
            </div>
            <input
              type="range"
              min={100}
              max={1500}
              step={50}
              value={clickDelay}
              onChange={(event) => setClickDelay(Number(event.target.value))}
              className="mt-2 w-full cursor-pointer"
            />
          </div>

          <div className="rounded-lg bg-black/20 px-3 py-2 text-xs text-white/70" onPointerDown={(e) => e.stopPropagation()}>
            <p className="text-white/50">Evaluation</p>
            <p className="font-semibold text-white">
              {evaluation >= 0 ? "+" : ""}
              {evaluation.toFixed(2)}
            </p>
          </div>

          <div className="rounded-lg bg-black/20 px-3 py-2 text-xs text-white/70" onPointerDown={(e) => e.stopPropagation()}>
            <p className="text-white/50">FEN (현재 포지션)</p>
            <p className="break-all text-[10px] font-mono">{currentFen}</p>
            {currentFen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" && (
              <p className="mt-1 text-[10px] text-yellow-400/80"> 시작 포지션 - 체스판에서 수를 두면 감지됩니다</p>
            )}
          </div>

          <div className="rounded-lg bg-black/20 px-3 py-2 text-xs text-white/70" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/50 font-semibold"> 미세 조정</p>
              <button
                onClick={() => {
                  setAreaOffsetX(0);
                  setAreaOffsetY(0);
                  setAreaScale(1);
                  addLog(" 조정값 초기화");
                }}
                className="px-2 py-1 rounded text-[9px] bg-white/10 hover:bg-white/20 cursor-pointer"
              >
                초기화
              </button>
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center gap-2">
                <label className="w-16 text-white/50">X 이동</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={areaOffsetX}
                  onChange={(e) => setAreaOffsetX(Number(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <span className="w-12 text-right text-white/80">{areaOffsetX}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16 text-white/50">Y 이동</label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={areaOffsetY}
                  onChange={(e) => setAreaOffsetY(Number(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <span className="w-12 text-right text-white/80">{areaOffsetY}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16 text-white/50">크기</label>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.01"
                  value={areaScale}
                  onChange={(e) => setAreaScale(Number(e.target.value))}
                  className="flex-1 cursor-pointer"
                />
                <span className="w-12 text-right text-white/80">{areaScale.toFixed(2)}</span>
              </div>
            </div>
            <p className="mt-2 text-[9px] text-white/40">
               그리드가 안 맞으면 슬라이더로 미세 조정하세요
            </p>
          </div>

          <div className="rounded-lg bg-black/20 px-3 py-2 text-xs text-white/70" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/50 font-semibold"> 인식 이미지</p>
              {debugImage && (
                <button
                  onClick={() => setDebugImage(null)}
                  className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/20 cursor-pointer"
                >
                  숨기기
                </button>
              )}
            </div>
            {debugImage ? (
              <div>
                <img
                  src={debugImage}
                  alt="Recognition capture"
                  className="w-full rounded-md border-2 border-green-400/50"
                />
                <div className="mt-1 space-y-1 text-[9px]">
                  <p className="text-green-400/80"> 녹색 = 체스판 경계</p>
                  <p className="text-blue-400/80"> 파란색 = 8×8 그리드</p>
                  <p className="text-red-400/80"> 빨간색 = 코너 라벨 (a8, h8, a1, h1)</p>
                  <p className="text-white/60">각 칸이 체스판 칸과 정확히 일치하는지 확인하세요!</p>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-4 rounded-md bg-white/5 text-center">
                <p className="text-white/40 text-[10px]">인식 이미지 없음</p>
                <p className="text-white/30 text-[9px] mt-1">즉시 인식 버튼을 눌러보세요</p>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-black/20 px-3 py-2 text-xs text-white/70" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/50">Logs ({logs.length})</p>
              <div className="flex gap-1">
                {bestMove && (
                  <button
                    onClick={() => executeMove(bestMove)}
                    disabled={!boardArea}
                    className={cn(
                      "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors cursor-pointer",
                      !boardArea
                        ? "bg-white/10 text-white/40"
                        : "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30"
                    )}
                  >
                    ▶ 실행
                  </button>
                )}
                <button
                  onClick={() => {
                    const logContainer = logEndRef.current?.parentElement;
                    logContainer?.scrollTo({ top: logContainer.scrollHeight, behavior: 'smooth' });
                  }}
                  className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/70 hover:bg-white/20 cursor-pointer"
                >
                  
                </button>
              </div>
            </div>
            <button
              onClick={dumpState}
              className="mb-2 w-full rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/20 cursor-pointer"
            >
               상태 덤프
            </button>
            <div className="max-h-32 space-y-1 overflow-y-auto scrollbar-hide">
              {logs.length === 0 ? (
                <p className="text-white/40">기록 없음</p>
              ) : (
                logs.slice(-30).map((log, index) => <p key={`${log}-${index}`} className="text-[10px]">{log}</p>)
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

GlassCalendar.displayName = "GlassCalendar";
