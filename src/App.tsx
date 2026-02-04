import { Component } from "./components/ui/chess-cheating";
import { AutoChessComponent } from "./components/ui/auto-chess";
import { useState } from "react";
import { MacOSGlassCard, MacOSButton, MacOSText } from "./components/ui/macos-glass";

function App() {
  const [mode, setMode] = useState<"demo" | "auto" | "select">("select");

  if (mode === "select") {
    return (
      <div
        className="h-full w-full flex items-center justify-center macos-scale-in"
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <MacOSGlassCard hover={true} style={{ padding: "40px", maxWidth: "500px" }}>
          <div className="flex flex-col gap-6">
            <MacOSText className="text-2xl font-bold text-center">
              ♟️ Chess Widget
            </MacOSText>

            <MacOSButton
              variant="blue"
              onClick={() => setMode("demo")}
              style={{ padding: "16px 32px", fontSize: "16px" }}
            >
              📚 데모 모드 (연습용)
            </MacOSButton>

            <MacOSButton
              variant="green"
              onClick={() => setMode("auto")}
              style={{ padding: "16px 32px", fontSize: "16px" }}
            >
              🤖 자동 플레이어 (로컬 체스판용)
            </MacOSButton>

            <MacOSText variant="tertiary" className="text-xs text-center mt-2">
              ⚠️ 자동 플레이어는 로컬 체스 앱 학습용입니다
            </MacOSText>
          </div>
        </MacOSGlassCard>
      </div>
    );
  }

  if (mode === "auto") {
    return <AutoChessComponent />;
  }

  return <Component />;
}

export default App;
