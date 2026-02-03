import React, { useRef } from 'react';

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
  blurAmount = 2,
  opacity = 0.15,
  borderRadius = 28,
  enableHoverEffect = true,
}: LiquidGlassProps) {
  const filterId = useRef(`liquid-glass-${Math.random().toString(36).substr(2, 9)}`);

  return (
    <>
      {/* SVG Displacement Filter - Core of liquid glass effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={filterId.current}>
            {/* Turbulence creates the frosted glass texture */}
            <feTurbulence
              type="turbulence"
              baseFrequency="0.01"
              numOctaves="2"
              result="turbulence"
            />

            {/* Displacement creates the liquid distortion */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="200"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={`liquid-glass-container ${className}`}
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          overflow: 'hidden',
          borderRadius: `${borderRadius}px`,
          transition: 'opacity 0.26s ease-out',

          // Main liquid glass effect
          filter: `drop-shadow(-8px -10px 46px rgba(0, 0, 0, 0.37))`,
          backdropFilter: `brightness(1.1) blur(${blurAmount}px) url(#${filterId.current})`,
          WebkitBackdropFilter: `brightness(1.1) blur(${blurAmount}px) url(#${filterId.current})`,

          // Semi-transparent background
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        }}
      >
        {/* Inner glow border effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            overflow: 'hidden',
            borderRadius: `${borderRadius}px`,
            boxShadow: `
              inset 6px 6px 0px -6px rgba(255, 255, 255, 0.7),
              inset 0 0 8px 1px rgba(255, 255, 255, 0.7)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          {children}
        </div>
      </div>
    </>
  );
}
