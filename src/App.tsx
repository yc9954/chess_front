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
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "40px",
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
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
            style={{
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.95)",
              background: "rgba(99, 179, 237, 0.5)",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(99, 179, 237, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(99, 179, 237, 0.5)";
            }}
          >
            📚 데모 모드 (연습용)
          </button>
          <button
            onClick={() => setMode("auto")}
            style={{
              padding: "16px 32px",
              fontSize: "16px",
              fontWeight: "600",
              color: "rgba(255, 255, 255, 0.95)",
              background: "rgba(81, 207, 102, 0.5)",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(81, 207, 102, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(81, 207, 102, 0.5)";
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
