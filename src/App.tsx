import GlassCalendarDemo from "./components/ui/glass-calendar-demo";
import BoardSelectOverlay from "./components/ui/board-select-overlay";

function App() {
  const params = new URLSearchParams(window.location.search);
  const isBoardSelect = params.get("board-select") === "1";

  if (isBoardSelect) {
    return <BoardSelectOverlay />;
  }

  return <GlassCalendarDemo />;
}

export default App;
