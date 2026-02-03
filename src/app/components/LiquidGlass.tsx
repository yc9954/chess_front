import React, { useRef, useState, useEffect } from 'react';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  blurAmount?: number;
  opacity?: number;
  borderRadius?: number;
  enableHoverEffect?: boolean;
}

export function LiquidGlass({
  children,
  className = '',
  blurAmount = 24,
  opacity = 0.85,
  borderRadius = 16,
  enableHoverEffect = true,
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enableHoverEffect) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enableHoverEffect]);

  return (
    <div
      ref={containerRef}
      className={`liquid-glass-container ${className}`}
      style={{
        position: 'relative',
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {/* Background blur layer - Apple style */}
      <div
        className="liquid-glass-backdrop"
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
          backgroundColor: `rgba(255, 255, 255, ${opacity * 0.6})`,
          zIndex: -1,
        }}
      />

      {/* Subtle gradient overlay - very minimal */}
      {enableHoverEffect && (
        <div
          className="liquid-glass-gradient"
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(
                1000px circle at ${mousePosition.x}% ${mousePosition.y}%,
                rgba(255, 255, 255, ${isHovering ? 0.3 : 0.1}),
                transparent 50%
              )
            `,
            opacity: isHovering ? 0.5 : 0.2,
            transition: 'opacity 0.8s ease-out',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Subtle border - Apple style */}
      <div
        className="liquid-glass-border"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${borderRadius}px`,
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: `
            0 4px 24px -4px rgba(0, 0, 0, 0.1),
            0 2px 6px -2px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.8)
          `,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
