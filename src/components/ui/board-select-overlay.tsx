import * as React from "react";
import { createPortal } from "react-dom";
import { emit } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Point = { x: number; y: number };
type BoardArea = { topLeft: Point; bottomRight: Point };

interface BoardSelectOverlayProps {
  onSelect?: (area: BoardArea) => void;
  onCancel?: () => void;
}

export default function BoardSelectOverlay({
  onSelect,
  onCancel,
}: BoardSelectOverlayProps) {
  const [start, setStart] = React.useState<Point | null>(null);
  const [current, setCurrent] = React.useState<Point | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = { x: event.clientX, y: event.clientY };
    setStart(point);
    setCurrent(point);
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setCurrent({ x: event.clientX, y: event.clientY });
  };

  const handlePointerUp = async (event: React.PointerEvent<HTMLDivElement>) => {
    if (!start) return;
    const end = { x: event.clientX, y: event.clientY };
    const area = {
      topLeft: {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
      },
      bottomRight: {
        x: Math.max(start.x, end.x),
        y: Math.max(start.y, end.y),
      },
    };

    if (onSelect) {
      onSelect(area);
      return;
    }

    await emit("board-area-selected", area);
    await getCurrentWindow().close();
  };

  const rect =
    start && current
      ? {
          left: Math.min(start.x, current.x),
          top: Math.min(start.y, current.y),
          width: Math.abs(start.x - current.x),
          height: Math.abs(start.y - current.y),
        }
      : null;

  const content = (
    <div
      className="fixed inset-0 z-50 cursor-crosshair"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onCancel?.();
        }
      }}
      tabIndex={0}
      style={{
        background: "rgba(0,0,0,0.1)",
        backdropFilter: "blur(2px)",
      }}
    >
      {rect && (
        <div
          className="absolute border-2 border-white/80 bg-white/10"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
      <div className="absolute left-4 top-4 rounded-md bg-black/60 px-3 py-2 text-xs text-white">
        드래그해서 체스판 영역을 선택하세요 (ESC 취소)
      </div>
      <button
        className="absolute right-4 top-4 rounded-md bg-black/60 px-3 py-2 text-xs text-white hover:bg-black/70"
        onClick={(event) => {
          event.stopPropagation();
          onCancel?.();
        }}
      >
        취소
      </button>
    </div>
  );

  return createPortal(content, document.body);
}
