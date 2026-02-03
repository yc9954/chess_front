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
      {/* Background blur layer */}
      <div
        className="liquid-glass-backdrop"
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
          backgroundColor: `rgba(15, 23, 42, ${opacity})`,
          zIndex: -1,
        }}
      />

      {/* Gradient overlay */}
      <div
        className="liquid-glass-gradient"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(
              800px circle at ${mousePosition.x}% ${mousePosition.y}%,
              rgba(99, 102, 241, ${isHovering ? 0.15 : 0.08}),
              transparent 40%
            )
          `,
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Shimmer effect */}
      <div
        className="liquid-glass-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(
              135deg,
              transparent 0%,
              rgba(255, 255, 255, ${isHovering ? 0.1 : 0.05}) 50%,
              transparent 100%
            )
          `,
          transform: `translate(${mousePosition.x / 10 - 5}%, ${mousePosition.y / 10 - 5}%)`,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Border glow */}
      <div
        className="liquid-glass-border"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${borderRadius}px`,
          padding: '1px',
          background: `
            linear-gradient(
              ${Math.atan2(mousePosition.y - 50, mousePosition.x - 50) * (180 / Math.PI) + 90}deg,
              rgba(255, 255, 255, ${isHovering ? 0.3 : 0.15}),
              rgba(255, 255, 255, 0.05)
            )
          `,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
