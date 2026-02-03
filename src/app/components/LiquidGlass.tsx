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
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const filterId = useRef(`liquid-glass-${Math.random().toString(36).substr(2, 9)}`);

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
    <>
      {/* SVG Filters - Hidden */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={filterId.current} x="-50%" y="-50%" width="200%" height="200%">
            {/* Noise texture for frosted glass */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              result="noise"
            />

            {/* Displacement for glass distortion */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />

            {/* Color adjustment for better saturation */}
            <feColorMatrix
              in="displaced"
              type="saturate"
              values="1.2"
              result="saturated"
            />

            {/* Slight blur for smoothness */}
            <feGaussianBlur
              in="saturated"
              stdDeviation="0.5"
              result="blurred"
            />

            {/* Merge with original */}
            <feBlend in="blurred" in2="SourceGraphic" mode="normal" />
          </filter>
        </defs>
      </svg>

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
        {/* Layer 1: Shadow - Depth and separation */}
        <div
          className="liquid-glass-shadow"
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(
                circle at ${mousePosition.x}% ${mousePosition.y}%,
                rgba(0, 0, 0, 0.02),
                rgba(0, 0, 0, 0.08) 100%
              )
            `,
            zIndex: -3,
            pointerEvents: 'none',
          }}
        />

        {/* Layer 2: Backdrop blur with frosted glass effect */}
        <div
          className="liquid-glass-backdrop"
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: `blur(${blurAmount}px) saturate(180%) contrast(110%)`,
            WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%) contrast(110%)`,
            backgroundColor: `rgba(255, 255, 255, ${opacity * 0.6})`,
            filter: `url(#${filterId.current})`,
            zIndex: -2,
          }}
        />

        {/* Layer 3: Noise texture overlay for frosted appearance */}
        <div
          className="liquid-glass-noise"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.03) 0px,
                transparent 1px,
                transparent 2px,
                rgba(255, 255, 255, 0.03) 3px
              ),
              repeating-linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.03) 0px,
                transparent 1px,
                transparent 2px,
                rgba(255, 255, 255, 0.03) 3px
              )
            `,
            opacity: 0.4,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />

        {/* Layer 4: Highlight - Dynamic light effect */}
        {enableHoverEffect && (
          <div
            className="liquid-glass-highlight"
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(
                  600px circle at ${mousePosition.x}% ${mousePosition.y}%,
                  rgba(255, 255, 255, ${isHovering ? 0.25 : 0.1}),
                  transparent 60%
                )
              `,
              opacity: isHovering ? 0.8 : 0.3,
              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Layer 5: Illumination - Specular highlights on edges */}
        <div
          className="liquid-glass-specular"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${borderRadius}px`,
            background: `
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.6) 0%,
                transparent 20%,
                transparent 80%,
                rgba(255, 255, 255, 0.3) 100%
              )
            `,
            opacity: 0.3,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Border with inner glow */}
        <div
          className="liquid-glass-border"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${borderRadius}px`,
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: `
              0 8px 32px -8px rgba(0, 0, 0, 0.12),
              0 4px 16px -4px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.9),
              inset 0 -1px 0 0 rgba(255, 255, 255, 0.4)
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
    </>
  );
}
