import React, { useState, useRef, useEffect } from 'react';
import { Check, ScanSearch } from 'lucide-react';

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CalibrationFrameProps {
    rect: Rect;
    onChange: (rect: Rect) => void;
    onConfirm: () => void;
    onScan: () => void;
    isScanning: boolean;
}

export function CalibrationFrame({ rect, onChange, onConfirm, onScan, isScanning }: CalibrationFrameProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const frameRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // Don't drag if clicking buttons or resize handles
        if (target.closest('button') || target.classList.contains('resize-handle')) return;

        setIsDragging(true);
        setDragOffset({
            x: e.clientX - rect.x,
            y: e.clientY - rect.y
        });
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                onChange({
                    ...rect,
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            } else if (isResizing) {
                const newWidth = Math.max(100, e.clientX - rect.x);
                const newHeight = Math.max(100, e.clientY - rect.y);
                onChange({
                    ...rect,
                    width: newWidth,
                    height: newHeight
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, rect, onChange]);

    return (
        <div
            ref={frameRef}
            className="absolute border-4 border-dashed border-cyan-500 rounded-lg group pointer-events-auto z-50"
            style={{
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                cursor: isDragging ? 'grabbing' : 'move',
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header/Controls */}
            <div className="absolute -top-10 left-0 right-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-cyan-400 text-xs font-mono bg-slate-900/90 px-3 py-1.5 rounded-lg shadow-lg border border-cyan-500/30">
                        Adjust Area ({Math.round(rect.width)}x{Math.round(rect.height)})
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onScan(); }}
                        disabled={isScanning}
                        className="bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white p-1.5 rounded-lg shadow-lg transition-all flex items-center gap-1.5 pointer-events-auto"
                        title="Auto-detect chess board"
                    >
                        <ScanSearch className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-bold pr-1">{isScanning ? 'Scanning...' : 'Scan'}</span>
                    </button>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                    className="bg-green-500 hover:bg-green-400 text-white p-1.5 rounded-lg shadow-lg transition-all flex items-center gap-1.5 pointer-events-auto"
                >
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-bold pr-1">Confirm</span>
                </button>
            </div>

            {/* Resize Handle (Bottom Right) */}
            <div
                className="resize-handle absolute bottom-0 right-0 w-6 h-6 bg-cyan-500 cursor-se-resize rounded-tl-lg hover:bg-cyan-400 transition-colors shadow-lg"
                onMouseDown={handleResizeStart}
            />
        </div>
    );
}
