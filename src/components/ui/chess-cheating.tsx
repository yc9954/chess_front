import React, { useState, useRef, useEffect } from "react";

// Types
interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface SquareProps {
  row: number;
  col: number;
  piece: string | null;
  isHighlighted: boolean;
  isPossibleMove: boolean;
  isThreatened: boolean;
  onClick: () => void;
}

interface AnalysisMessage {
  id: string;
  type: "move" | "evaluation" | "threat" | "info";
  message: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  message: string;
  timestamp: Date;
}

interface MoveOption {
  move: string;
  evaluation: number;
  depth: number;
}

// Glass Effect Wrapper Component
const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  return (
    <div
      className={`relative flex font-semibold overflow-hidden text-black transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers - Apple style blur always active */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-3xl"
        style={{
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          isolation: "isolate",
          willChange: "backdrop-filter",
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-3xl overflow-hidden"
        style={{ 
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <div
        className="absolute inset-0 z-20 rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </div>
  );
};

// SVG Filter Component
const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="200"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

// Chess Square Component
const Square: React.FC<SquareProps> = ({
  row,
  col,
  piece,
  isHighlighted,
  isPossibleMove,
  isThreatened,
  onClick,
}) => {
  const isLight = (row + col) % 2 === 0;
  const bgColor = isLight ? "rgba(240, 217, 181, 0.8)" : "rgba(181, 136, 99, 0.8)";

  return (
    <div
      className="relative w-full h-full flex items-center justify-center cursor-pointer transition-all"
      style={{
        backgroundColor: isHighlighted
          ? "rgba(255, 255, 0, 0.4)"
          : isThreatened
          ? "rgba(255, 0, 0, 0.3)"
          : isPossibleMove
          ? "rgba(0, 255, 0, 0.3)"
          : bgColor,
        aspectRatio: "1 / 1",
      }}
      onClick={onClick}
    >
      {piece && (
        <span 
          className="font-bold" 
          style={{ 
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            fontSize: "2.5rem",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {piece}
        </span>
      )}
      {isPossibleMove && !piece && (
        <div
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: "rgba(0, 255, 0, 0.6)" }}
        />
      )}
    </div>
  );
};

// Main Chess Cheating Component
export const Component = () => {
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Set<string>>(new Set());
  const [threatenedSquares, setThreatenedSquares] = useState<Set<string>>(new Set());
  const [evaluation, setEvaluation] = useState<number>(0);
  const [bestMove, setBestMove] = useState<string>("");
  const [moveOptions, setMoveOptions] = useState<MoveOption[]>([]);
  const [analysisMessages, setAnalysisMessages] = useState<AnalysisMessage[]>([]);
  const [isWhiteTurn, setIsWhiteTurn] = useState<boolean>(true);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [isInCheck, setIsInCheck] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // 초기 체스 보드
  const initialBoard = [
    ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
    ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
    ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
  ];

  const [board, setBoard] = useState<(string | null)[][]>(initialBoard);

  const addAnalysisMessage = (type: AnalysisMessage["type"], message: string) => {
    setAnalysisMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date(),
      },
    ]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [analysisMessages, chatMessages]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiThinking) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      message: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsAiThinking(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiResponses = [
        "이 위치에서 가장 좋은 이동은 e4입니다. 중앙을 장악하고 기물의 활동성을 높일 수 있습니다.",
        "현재 평가는 백에게 약간 유리합니다. 기물의 배치가 좋고 공간을 잘 활용하고 있습니다.",
        "d5 칸에 위협이 있습니다. 기물을 보호하거나 상대의 공격을 피하는 것이 좋겠습니다.",
        "이 시점에서 캐슬링을 고려해볼 수 있습니다. 킹의 안전을 확보하고 룩을 활성화할 수 있습니다.",
        "기물 교환을 통해 유리한 엔드게임으로 이끌 수 있는 기회입니다.",
      ];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        message: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
      setIsAiThinking(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSquareClick = (row: number, col: number) => {
    const squareKey = `${row}-${col}`;
    
    if (selectedSquare && possibleMoves.has(squareKey)) {
      // 이동 실행
      const [fromRow, fromCol] = [selectedSquare.row, selectedSquare.col];
      const newBoard = board.map((r) => [...r]);
      const piece = newBoard[fromRow][fromCol];
      newBoard[row][col] = piece;
      newBoard[fromRow][fromCol] = null;
      setBoard(newBoard);
      setSelectedSquare(null);
      setPossibleMoves(new Set());
      setThreatenedSquares(new Set());
      
      // 이동 표기법 생성
      const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}${String.fromCharCode(97 + col)}${8 - row}`;
      const newEvaluation = (Math.random() * 2 - 1);
      setEvaluation(newEvaluation);
      setBestMove(moveNotation);
      setMoveCount((prev) => prev + 1);
      setIsWhiteTurn((prev) => !prev);
      
      // 분석 메시지 추가
      addAnalysisMessage("move", `이동: ${moveNotation}`);
      addAnalysisMessage("evaluation", `평가: ${newEvaluation > 0 ? "+" : ""}${newEvaluation.toFixed(2)}`);
      
      // 가능한 이동 옵션 생성 (임시)
      const options: MoveOption[] = [];
      for (let i = 0; i < 5; i++) {
        options.push({
          move: `${String.fromCharCode(97 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 8) + 1}${String.fromCharCode(97 + Math.floor(Math.random() * 8))}${Math.floor(Math.random() * 8) + 1}`,
          evaluation: newEvaluation + (Math.random() * 0.5 - 0.25),
          depth: 12 + Math.floor(Math.random() * 5),
        });
      }
      options.sort((a, b) => b.evaluation - a.evaluation);
      setMoveOptions(options);
      
      addAnalysisMessage("info", `최선의 이동: ${options[0].move} (평가: ${options[0].evaluation > 0 ? "+" : ""}${options[0].evaluation.toFixed(2)})`);
      
      // 위협 분석 (임시)
      const threats = new Set<string>();
      for (let i = 0; i < 3; i++) {
        threats.add(`${Math.floor(Math.random() * 8)}-${Math.floor(Math.random() * 8)}`);
      }
      setThreatenedSquares(threats);
      if (threats.size > 0) {
        addAnalysisMessage("threat", `${threats.size}개의 위협이 감지되었습니다.`);
      }
    } else {
      // 새로운 말 선택
      setSelectedSquare({ row, col });
      const moves = new Set<string>();
      if (board[row][col]) {
        // 가능한 이동 계산 (임시)
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (r !== row || c !== col) {
              moves.add(`${r}-${c}`);
            }
          }
        }
      }
      setPossibleMoves(moves);
      
      if (board[row][col]) {
        addAnalysisMessage("info", `${board[row][col]} 선택됨. ${moves.size}개의 가능한 이동.`);
      }
    }
  };

  return (
    <div
      className="h-full w-full flex items-center justify-center font-light relative"
      style={{
        background: "transparent",
        backgroundColor: "transparent",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* 전체 배경 blur 레이어 - 항상 활성화 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <GlassFilter />

      <GlassEffect 
        className="rounded-3xl p-6" 
        style={{ 
          cursor: "default",
          width: "calc(100% - 32px)",
          height: "calc(100% - 32px)",
          maxWidth: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          margin: "16px",
          zIndex: 10,
        }}
        data-tauri-drag-region
      >
        <div className="flex gap-6 items-stretch justify-center w-full h-full" style={{ flex: "1 1 auto", minHeight: 0 }}>
        {/* 좌측: 체스 보드 및 기본 정보 */}
        <div 
          className="flex flex-col gap-3 flex-shrink-0" 
          style={{ pointerEvents: "auto", userSelect: "none" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="rounded-3xl p-4 flex-shrink-0" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
            <div className="flex flex-col gap-3">
              {/* 게임 정보 */}
              <div className="flex items-center justify-between gap-4 text-xs" style={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 400 }}>
                <div className="flex items-center gap-2">
                  <span className="opacity-70">턴:</span>
                  <span className="font-bold">{isWhiteTurn ? "백" : "흑"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="opacity-70">이동:</span>
                  <span className="font-bold">{moveCount}</span>
                </div>
                {isInCheck && (
                  <div className="flex items-center gap-2" style={{ color: "#cc6666" }}>
                    <span className="font-bold">체크!</span>
                  </div>
                )}
              </div>

              {/* 평가 및 최선의 이동 */}
              <div className="flex items-center justify-between gap-4 text-sm" style={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 400 }}>
                <div className="flex items-center gap-2">
                  <span className="opacity-70">평가:</span>
                  <span className="font-bold">{evaluation > 0 ? "+" : ""}{evaluation.toFixed(2)}</span>
                </div>
                {bestMove && (
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">최선:</span>
                    <span className="font-bold">{bestMove}</span>
                  </div>
                )}
              </div>

              {/* 체스 보드 */}
              <div 
                className="grid grid-cols-8 gap-0"
                style={{ 
                  width: "400px", 
                  height: "400px",
                  aspectRatio: "1 / 1",
                  flexShrink: 0,
                }}
              >
                {board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => (
                    <Square
                      key={`${rowIndex}-${colIndex}`}
                      row={rowIndex}
                      col={colIndex}
                      piece={piece}
                      isHighlighted={
                        selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex
                      }
                      isPossibleMove={possibleMoves.has(`${rowIndex}-${colIndex}`)}
                      isThreatened={threatenedSquares.has(`${rowIndex}-${colIndex}`)}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 분석 패널 */}
        <div 
          className="flex flex-col gap-3 flex-1 min-w-0 min-h-0" 
          style={{ pointerEvents: "auto", userSelect: "none" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* AI 채팅 */}
          <div className="rounded-3xl p-4 flex flex-col" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", height: "300px", flexShrink: 0 }}>
            <div className="flex flex-col h-full">
              <div className="text-sm mb-2" style={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>AI 채팅</div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-2" style={{ minHeight: 0, maxHeight: "200px" }}>
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="text-xs p-2 rounded-lg"
                    style={{
                      backgroundColor: msg.role === "user" 
                        ? "rgba(0, 150, 255, 0.25)" 
                        : "rgba(255, 255, 255, 0.1)",
                      color: "rgba(255, 255, 255, 0.9)",
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      fontWeight: 400,
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="opacity-60 text-xs">
                        {msg.role === "user" ? "나" : "AI"} · {msg.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="font-semibold">{msg.message}</span>
                    </div>
                  </div>
                ))}
                {isAiThinking && (
                  <div className="text-xs p-2 rounded-lg" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", color: "rgba(255, 255, 255, 0.7)", fontWeight: 400 }}>
                    <span>AI가 생각 중...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="AI에게 질문하기..."
                  className="flex-1 px-3 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    color: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    outline: "none",
                    fontWeight: 400,
                  }}
                  disabled={isAiThinking}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-opacity"
                  style={{
                    backgroundColor: "rgba(0, 150, 255, 0.4)",
                    color: "rgba(255, 255, 255, 0.9)",
                    border: "none",
                    cursor: isAiThinking ? "not-allowed" : "pointer",
                    opacity: isAiThinking ? 0.5 : 1,
                    fontWeight: 500,
                  }}
                  disabled={isAiThinking || !chatInput.trim()}
                >
                  전송
                </button>
              </form>
            </div>
          </div>

          {/* 상세 분석 로그 */}
          <div className="rounded-3xl p-4 flex flex-col" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)", height: "200px", flexShrink: 0 }}>
            <div className="flex flex-col h-full">
              <div className="text-sm mb-2" style={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>분석 로그</div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ minHeight: 0, maxHeight: "150px" }}>
                {analysisMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="text-xs p-2 rounded-lg"
                    style={{
                      color: "rgba(255, 255, 255, 0.9)",
                      fontWeight: 400,
                      backgroundColor:
                        msg.type === "move"
                          ? "rgba(0, 150, 255, 0.25)"
                          : msg.type === "threat"
                          ? "rgba(255, 0, 0, 0.25)"
                          : msg.type === "evaluation"
                          ? "rgba(0, 255, 150, 0.25)"
                          : "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-60 text-xs">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="font-semibold">{msg.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 가능한 이동 목록 */}
          {moveOptions.length > 0 && (
            <div className="rounded-3xl p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
              <div className="flex flex-col gap-2">
                <div className="text-sm mb-1" style={{ color: "rgba(255, 255, 255, 0.9)", fontWeight: 500 }}>추천 이동</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {moveOptions.slice(0, 5).map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs p-2 rounded"
                      style={{ 
                        color: "rgba(255, 255, 255, 0.9)",
                        fontWeight: 400,
                        backgroundColor: "rgba(255, 255, 255, 0.1)" 
                      }}
                    >
                      <span className="font-mono">{option.move}</span>
                      <div className="flex items-center gap-2">
                        <span className="opacity-70">깊이 {option.depth}</span>
                        <span className="font-bold">
                          {option.evaluation > 0 ? "+" : ""}
                          {option.evaluation.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </GlassEffect>

    </div>
  );
};
