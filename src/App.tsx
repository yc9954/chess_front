import { Component } from "./components/ui/chess-cheating";

function App() {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* 전체 배경 blur 레이어 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Component />
    </div>
  );
}

export default App;
