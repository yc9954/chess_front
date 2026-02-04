import React, { useState, useRef, useEffect } from "react";
import {
  MacOSGlassCard,
  MacOSButton,
  MacOSText,
  MacOSDragHandle,
  MacOSInput,
  MacOSScrollView,
  MacOSBadge,
  MacOSDivider,
} from "./macos-glass";

// Types
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
  const bgColor = isLight ? "rgba(240, 217, 181, 0.95)" : "rgba(181, 136, 99, 0.95)";

  return (
    <div
      className="relative w-full h-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-95"
      style={{
        backgroundColor: isHighlighted
          ? "rgba(var(--macos-yellow), 0.6)"
          : isThreatened
          ? "rgba(var(--macos-red), 0.5)"
          : isPossibleMove
          ? "rgba(var(--macos-green), 0.4)"
          : bgColor,
        aspectRatio: "1 / 1",
      }}
      onClick={onClick}
    >
      {piece && (
        <span
          className="font-bold select-none transition-transform duration-200 hover:scale-110"
          style={{
            textShadow: "0 3px 6px rgba(0,0,0,0.7)",
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
            backgroundColor: "rgba(var(--macos-green), 0.8)",
            boxShadow: "0 0 16px rgba(var(--macos-green), 0.7)",
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
      className="h-full w-full flex items-center justify-center macos-fade-in"
      style={{
        background: "transparent",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <MacOSGlassCard
        hover={true}
        className="flex flex-col"
        style={{
          width: "calc(100% - 40px)",
          height: "calc(100% - 40px)",
          maxWidth: "100%",
          maxHeight: "100%",
          margin: "20px",
        }}
      >
        <MacOSDragHandle />

        <div className="flex gap-6 items-stretch justify-center w-full h-full p-6" style={{ flex: "1 1 auto", minHeight: 0 }}>
          <div className="flex flex-col gap-4 flex-shrink-0">
            <MacOSGlassCard hover={true} style={{ padding: "20px" }}>
              <div className="flex flex-col gap-4">
                {/* 게임 정보 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <MacOSText variant="secondary" className="text-sm">턴:</MacOSText>
                    <MacOSBadge variant={isWhiteTurn ? "gray" : "blue"}>
                      {isWhiteTurn ? "백" : "흑"}
                    </MacOSBadge>
                  </div>
                  <div className="flex items-center gap-3">
                    <MacOSText variant="secondary" className="text-sm">이동:</MacOSText>
                    <MacOSBadge variant="blue">{moveCount}</MacOSBadge>
                  </div>
                  {isInCheck && <MacOSBadge variant="red">체크!</MacOSBadge>}
                </div>

                <MacOSDivider />

                {/* 평가 및 최선의 이동 */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <MacOSText variant="secondary" className="text-sm">평가:</MacOSText>
                    <MacOSBadge variant={evaluation > 0 ? "green" : evaluation < 0 ? "red" : "gray"}>
                      {evaluation > 0 ? "+" : ""}{evaluation.toFixed(2)}
                    </MacOSBadge>
                  </div>
                  {bestMove && (
                    <div className="flex items-center gap-3">
                      <MacOSText variant="secondary" className="text-sm">최선:</MacOSText>
                      <MacOSBadge variant="blue" className="font-mono">{bestMove}</MacOSBadge>
                    </div>
                  )}
                </div>

                <MacOSDivider />

                {/* 체스 보드 */}
                <div
                  className="grid grid-cols-8 gap-0 rounded-xl overflow-hidden macos-scale-in"
                  style={{
                    width: "400px",
                    height: "400px",
                    aspectRatio: "1 / 1",
                    flexShrink: 0,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
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
            </MacOSGlassCard>
          </div>

          <div className="flex flex-col gap-4 flex-1 min-w-0 min-h-0">
            {/* AI 채팅 */}
            <MacOSGlassCard hover={true} style={{ padding: "20px", height: "300px", flexShrink: 0 }}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: "18px" }}>💬</span>
                  <MacOSText className="text-base font-semibold">AI 채팅</MacOSText>
                </div>

                <MacOSScrollView maxHeight="160px" className="flex-1 mb-3">
                  <div className="space-y-2 pr-2">
                    {chatMessages.map((msg) => (
                      <MacOSGlassCard
                        key={msg.id}
                        className="p-3 macos-fade-in"
                        style={{
                          backgroundColor: msg.role === "user"
                            ? "rgba(var(--macos-blue), 0.3)"
                            : "rgba(var(--glass-white), 0.08)",
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <MacOSText variant="tertiary" className="text-xs">
                            {msg.role === "user" ? "나" : "AI"} · {msg.timestamp.toLocaleTimeString()}
                          </MacOSText>
                          <MacOSText className="text-sm">{msg.message}</MacOSText>
                        </div>
                      </MacOSGlassCard>
                    ))}
                    {isAiThinking && (
                      <MacOSGlassCard className="p-3 flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" />
                          <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: "300ms" }} />
                        </div>
                        <MacOSText variant="secondary" className="text-sm">AI가 생각 중...</MacOSText>
                      </MacOSGlassCard>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </MacOSScrollView>

                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <MacOSInput
                    value={chatInput}
                    onChange={setChatInput}
                    placeholder="AI에게 질문하기..."
                    disabled={isAiThinking}
                    className="flex-1"
                  />
                  <MacOSButton
                    variant="blue"
                    onClick={handleChatSubmit}
                    disabled={isAiThinking || !chatInput.trim()}
                    style={{ padding: "10px 20px" }}
                  >
                    전송
                  </MacOSButton>
                </form>
              </div>
            </MacOSGlassCard>

            {/* 분석 로그 */}
            <MacOSGlassCard hover={true} style={{ padding: "20px", height: "200px", flexShrink: 0 }}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: "18px" }}>📊</span>
                  <MacOSText className="text-base font-semibold">분석 로그</MacOSText>
                </div>

                <MacOSScrollView maxHeight="130px">
                  <div className="space-y-2 pr-2">
                    {analysisMessages.map((msg) => (
                      <MacOSGlassCard
                        key={msg.id}
                        className="p-2.5 macos-fade-in"
                        style={{
                          backgroundColor:
                            msg.type === "move"
                              ? "rgba(var(--macos-blue), 0.25)"
                              : msg.type === "threat"
                              ? "rgba(var(--macos-red), 0.25)"
                              : msg.type === "evaluation"
                              ? "rgba(var(--macos-green), 0.25)"
                              : "rgba(var(--glass-white), 0.08)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <MacOSText variant="tertiary" className="text-xs">
                            {msg.timestamp.toLocaleTimeString()}
                          </MacOSText>
                          <MacOSText className="text-sm">{msg.message}</MacOSText>
                        </div>
                      </MacOSGlassCard>
                    ))}
                  </div>
                </MacOSScrollView>
              </div>
            </MacOSGlassCard>

            {/* 추천 이동 */}
            {moveOptions.length > 0 && (
              <MacOSGlassCard hover={true} style={{ padding: "20px" }}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "18px" }}>🎯</span>
                    <MacOSText className="text-base font-semibold">추천 이동</MacOSText>
                  </div>

                  <div className="space-y-2">
                    {moveOptions.slice(0, 5).map((option, index) => (
                      <MacOSGlassCard
                        key={index}
                        hover={true}
                        className="p-3 macos-fade-in"
                        style={{
                          backgroundColor: index === 0 ? "rgba(var(--macos-blue), 0.2)" : "rgba(var(--glass-white), 0.05)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <MacOSBadge variant={index === 0 ? "blue" : "gray"} className="font-mono">
                            {option.move}
                          </MacOSBadge>
                          <div className="flex items-center gap-3">
                            <MacOSText variant="secondary" className="text-xs">
                              깊이 {option.depth}
                            </MacOSText>
                            <MacOSBadge variant={option.evaluation > 0 ? "green" : option.evaluation < 0 ? "red" : "gray"}>
                              {option.evaluation > 0 ? "+" : ""}{option.evaluation.toFixed(2)}
                            </MacOSBadge>
                          </div>
                        </div>
                      </MacOSGlassCard>
                    ))}
                  </div>
                </div>
              </MacOSGlassCard>
            )}
          </div>
        </div>
      </MacOSGlassCard>
    </div>
  );
};
