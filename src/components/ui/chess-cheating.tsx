import React, { useState, useRef, useEffect } from "react";

// Types
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
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

// Glass Card Component (inspired by glass-calendar)
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  style = {},
  hover = false,
}) => {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-500 ${
        hover ? "hover:scale-105" : ""
      } ${className}`}
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

// Drag Handle Component
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
  const bgColor = isLight ? "rgba(240, 217, 181, 0.9)" : "rgba(181, 136, 99, 0.9)";

  return (
    <div
      className="relative w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:brightness-110"
      style={{
        backgroundColor: isHighlighted
          ? "rgba(255, 255, 0, 0.5)"
          : isThreatened
          ? "rgba(255, 0, 0, 0.4)"
          : isPossibleMove
          ? "rgba(0, 255, 0, 0.35)"
          : bgColor,
        aspectRatio: "1 / 1",
      }}
      onClick={onClick}
    >
      {piece && (
        <span
          className="font-bold select-none transition-transform duration-200 hover:scale-110"
          style={{
            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
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
          className="absolute w-3 h-3 rounded-full transition-all duration-200 animate-pulse"
          style={{
            backgroundColor: "rgba(0, 255, 0, 0.7)",
            boxShadow: "0 0 12px rgba(0, 255, 0, 0.6)",
          }}
        />
      )}
    </div>
  );
};

// Main Chess Component
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
      const [fromRow, fromCol] = [selectedSquare.row, selectedSquare.col];
      const newBoard = board.map((r) => [...r]);
      const piece = newBoard[fromRow][fromCol];
      newBoard[row][col] = piece;
      newBoard[fromRow][fromCol] = null;
      setBoard(newBoard);
      setSelectedSquare(null);
      setPossibleMoves(new Set());
      setThreatenedSquares(new Set());

      const moveNotation = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}${String.fromCharCode(97 + col)}${8 - row}`;
      const newEvaluation = Math.random() * 2 - 1;
      setEvaluation(newEvaluation);
      setBestMove(moveNotation);
      setMoveCount((prev) => prev + 1);
      setIsWhiteTurn((prev) => !prev);

      addAnalysisMessage("move", `이동: ${moveNotation}`);
      addAnalysisMessage("evaluation", `평가: ${newEvaluation > 0 ? "+" : ""}${newEvaluation.toFixed(2)}`);

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

      const threats = new Set<string>();
      for (let i = 0; i < 3; i++) {
        threats.add(`${Math.floor(Math.random() * 8)}-${Math.floor(Math.random() * 8)}`);
      }
      setThreatenedSquares(threats);
      if (threats.size > 0) {
        addAnalysisMessage("threat", `${threats.size}개의 위협이 감지되었습니다.`);
      }
    } else {
      setSelectedSquare({ row, col });
      const moves = new Set<string>();
      if (board[row][col]) {
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
        className="flex flex-col"
        hover={true}
        style={{
          width: "calc(100% - 40px)",
          height: "calc(100% - 40px)",
          maxWidth: "100%",
          maxHeight: "100%",
          margin: "20px",
        }}
      >
        <DragHandle />

        <div className="flex gap-6 items-stretch justify-center w-full h-full p-6" style={{ flex: "1 1 auto", minHeight: 0 }}>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <GlassCard hover={true} style={{ padding: "16px" }}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4 text-xs" style={{ color: "rgba(255, 255, 255, 0.95)", fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">턴:</span>
                    <span className="font-bold">{isWhiteTurn ? "백" : "흑"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">이동:</span>
                    <span className="font-bold">{moveCount}</span>
                  </div>
                  {isInCheck && (
                    <div className="flex items-center gap-2" style={{ color: "#ff6b6b" }}>
                      <span className="font-bold">체크!</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 text-sm" style={{ color: "rgba(255, 255, 255, 0.95)", fontWeight: 400 }}>
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">평가:</span>
                    <span
                      className="font-bold"
                      style={{
                        color: evaluation > 0 ? "#51cf66" : evaluation < 0 ? "#ff6b6b" : "rgba(255, 255, 255, 0.95)"
                      }}
                    >
                      {evaluation > 0 ? "+" : ""}{evaluation.toFixed(2)}
                    </span>
                  </div>
                  {bestMove && (
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">최선:</span>
                      <span className="font-bold font-mono">{bestMove}</span>
                    </div>
                  )}
                </div>

                <div
                  className="grid grid-cols-8 gap-0 rounded-lg overflow-hidden"
                  style={{
                    width: "400px",
                    height: "400px",
                    aspectRatio: "1 / 1",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {board.map((row, rowIndex) =>
                    row.map((piece, colIndex) => (
                      <Square
                        key={`${rowIndex}-${colIndex}`}
                        row={rowIndex}
                        col={colIndex}
                        piece={piece}
                        isHighlighted={selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex}
                        isPossibleMove={possibleMoves.has(`${rowIndex}-${colIndex}`)}
                        isThreatened={threatenedSquares.has(`${rowIndex}-${colIndex}`)}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                      />
                    ))
                  )}
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="flex flex-col gap-3 flex-1 min-w-0 min-h-0">
            <GlassCard hover={true} style={{ padding: "16px", height: "300px", flexShrink: 0 }}>
              <div className="flex flex-col h-full">
                <div className="text-sm mb-2 font-semibold" style={{ color: "rgba(255, 255, 255, 0.95)" }}>💬 AI 채팅</div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-2" style={{ minHeight: 0, maxHeight: "200px" }}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="text-xs p-2.5 rounded-lg transition-all duration-300 hover:scale-102"
                      style={{
                        backgroundColor: msg.role === "user" ? "rgba(99, 179, 237, 0.3)" : "rgba(255, 255, 255, 0.12)",
                        color: "rgba(255, 255, 255, 0.95)",
                        fontWeight: 400,
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="opacity-60 text-xs font-medium">
                          {msg.role === "user" ? "나" : "AI"} · {msg.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="font-normal">{msg.message}</span>
                      </div>
                    </div>
                  ))}
                  {isAiThinking && (
                    <div className="text-xs p-2.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", color: "rgba(255, 255, 255, 0.7)", fontWeight: 400 }}>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: "300ms" }} />
                      </div>
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
                    className="flex-1 px-3 py-2 rounded-lg text-xs transition-all duration-300 focus:ring-2 focus:ring-blue-400/50"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      color: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      outline: "none",
                      fontWeight: 400,
                    }}
                    disabled={isAiThinking}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: "rgba(99, 179, 237, 0.5)",
                      color: "rgba(255, 255, 255, 0.95)",
                      border: "none",
                      cursor: isAiThinking ? "not-allowed" : "pointer",
                      opacity: isAiThinking || !chatInput.trim() ? 0.5 : 1,
                      fontWeight: 500,
                    }}
                    disabled={isAiThinking || !chatInput.trim()}
                  >
                    전송
                  </button>
                </form>
              </div>
            </GlassCard>

            <GlassCard hover={true} style={{ padding: "16px", height: "200px", flexShrink: 0 }}>
              <div className="flex flex-col h-full">
                <div className="text-sm mb-2 font-semibold" style={{ color: "rgba(255, 255, 255, 0.95)" }}>📊 분석 로그</div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ minHeight: 0, maxHeight: "150px" }}>
                  {analysisMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="text-xs p-2 rounded-lg transition-all duration-300 hover:scale-102"
                      style={{
                        color: "rgba(255, 255, 255, 0.95)",
                        fontWeight: 400,
                        backgroundColor:
                          msg.type === "move"
                            ? "rgba(99, 179, 237, 0.3)"
                            : msg.type === "threat"
                            ? "rgba(255, 107, 107, 0.3)"
                            : msg.type === "evaluation"
                            ? "rgba(81, 207, 102, 0.3)"
                            : "rgba(255, 255, 255, 0.12)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="opacity-60 text-xs font-medium">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="font-normal">{msg.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {moveOptions.length > 0 && (
              <GlassCard hover={true} style={{ padding: "16px" }}>
                <div className="flex flex-col gap-2">
                  <div className="text-sm mb-1 font-semibold" style={{ color: "rgba(255, 255, 255, 0.95)" }}>🎯 추천 이동</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {moveOptions.slice(0, 5).map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs p-2 rounded transition-all duration-300 hover:scale-102 hover:bg-white/10"
                        style={{
                          color: "rgba(255, 255, 255, 0.95)",
                          fontWeight: 400,
                          backgroundColor: index === 0 ? "rgba(99, 179, 237, 0.2)" : "rgba(255, 255, 255, 0.08)"
                        }}
                      >
                        <span className="font-mono font-semibold">{option.move}</span>
                        <div className="flex items-center gap-2">
                          <span className="opacity-70">깊이 {option.depth}</span>
                          <span
                            className="font-bold"
                            style={{
                              color: option.evaluation > 0 ? "#51cf66" : option.evaluation < 0 ? "#ff6b6b" : "rgba(255, 255, 255, 0.95)"
                            }}
                          >
                            {option.evaluation > 0 ? "+" : ""}
                            {option.evaluation.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
