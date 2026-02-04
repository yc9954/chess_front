import { Component } from "./components/ui/chess-cheating";
import { AutoChessComponent } from "./components/ui/auto-chess";
import { useState } from "react";

function App() {
  const [mode, setMode] = useState<"demo" | "auto" | "select">("select");

  if (mode === "select") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          className="transition-all duration-500 hover:scale-105"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "40px",
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
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "rgba(255, 255, 255, 0.95)",
              textAlign: "center",
            }}
          >
            ♟️ Chess Widget
          </div>
          <button
            onClick={() => setMode("demo")}
            className="transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.95)",
              background: "linear-gradient(135deg, rgba(99, 179, 237, 0.6) 0%, rgba(99, 179, 237, 0.4) 100%)",
              border: "1px solid rgba(99, 179, 237, 0.3)",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99, 179, 237, 0.3)",
            }}
          >
            📚 데모 모드 (연습용)
          </button>
          <button
            onClick={() => setMode("auto")}
            className="transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.95)",
              background: "linear-gradient(135deg, rgba(81, 207, 102, 0.6) 0%, rgba(81, 207, 102, 0.4) 100%)",
              border: "1px solid rgba(81, 207, 102, 0.3)",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(81, 207, 102, 0.3)",
            }}
          >
            🤖 자동 플레이어 (로컬 체스판용)
          </button>
          <div
            style={{
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              marginTop: "10px",
            }}
          >
            ⚠️ 자동 플레이어는 로컬 체스 앱 학습용입니다
          </div>
        </div>
      </div>
    );
  }

  if (mode === "auto") {
    return <AutoChessComponent />;
  }

  return <Component />;
}

export default App;
