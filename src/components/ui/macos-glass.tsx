import React from "react";

// macOS GlassCard Props
interface MacOSGlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  onClick?: () => void;
}

// macOS Glass Card Component
export const MacOSGlassCard: React.FC<MacOSGlassCardProps> = ({
  children,
  className = "",
  style = {},
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={`macos-glass persistent-blur ${hover ? "macos-glass-hover" : ""} ${className}`}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        willChange: "transform",
        transform: "translateZ(0)",
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// macOS Button Props
interface MacOSButtonProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "red" | "gray";
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
}

// macOS Button Component
export const MacOSButton: React.FC<MacOSButtonProps> = ({
  children,
  variant = "blue",
  className = "",
  style = {},
  onClick,
  disabled = false,
}) => {
  const variantClass = {
    blue: "macos-blue-bg",
    green: "macos-green-bg",
    red: "macos-red-bg",
    gray: "macos-glass",
  }[variant];

  return (
    <button
      className={`${variantClass} persistent-blur macos-text-primary transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
      style={{
        padding: "10px 20px",
        borderRadius: "10px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontWeight: 600,
        fontSize: "14px",
        userSelect: "none",
        ...style,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// macOS Text Props
interface MacOSTextProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
  className?: string;
  style?: React.CSSProperties;
}

// macOS Text Component
export const MacOSText: React.FC<MacOSTextProps> = ({
  children,
  variant = "primary",
  className = "",
  style = {},
}) => {
  const variantClass = {
    primary: "macos-text-primary",
    secondary: "macos-text-secondary",
    tertiary: "macos-text-tertiary",
  }[variant];

  return (
    <div className={`${variantClass} ${className}`} style={style}>
      {children}
    </div>
  );
};

// macOS Drag Handle Props
interface MacOSDragHandleProps {
  className?: string;
}

// macOS Drag Handle Component
export const MacOSDragHandle: React.FC<MacOSDragHandleProps> = ({
  className = "",
}) => {
  return (
    <div
      data-tauri-drag-region
      className={`w-full flex items-center justify-center py-3 cursor-move transition-all duration-300 hover:bg-white/5 ${className}`}
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="flex gap-1.5" style={{ pointerEvents: "none" }}>
        <div className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }} />
        <div className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }} />
        <div className="w-1.5 h-1.5 rounded-full transition-all duration-300"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.5)" }} />
      </div>
    </div>
  );
};

// macOS Input Props
interface MacOSInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: string;
}

// macOS Input Component
export const MacOSInput: React.FC<MacOSInputProps> = ({
  value,
  onChange,
  placeholder = "",
  className = "",
  style = {},
  disabled = false,
  type = "text",
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`macos-glass persistent-blur macos-text-primary transition-all duration-300 focus:ring-2 focus:ring-blue-400/50 ${className}`}
      style={{
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        outline: "none",
        fontSize: "14px",
        ...style,
      }}
    />
  );
};

// macOS ScrollView Props
interface MacOSScrollViewProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxHeight?: string;
}

// macOS ScrollView Component
export const MacOSScrollView: React.FC<MacOSScrollViewProps> = ({
  children,
  className = "",
  style = {},
  maxHeight = "300px",
}) => {
  return (
    <div
      className={`macos-scrollbar overflow-y-auto ${className}`}
      style={{
        maxHeight,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// macOS Badge Props
interface MacOSBadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "red" | "yellow" | "gray";
  className?: string;
}

// macOS Badge Component
export const MacOSBadge: React.FC<MacOSBadgeProps> = ({
  children,
  variant = "blue",
  className = "",
}) => {
  const colors = {
    blue: "rgba(0, 122, 255, 0.7)",
    green: "rgba(52, 199, 89, 0.7)",
    red: "rgba(255, 59, 48, 0.7)",
    yellow: "rgba(255, 204, 0, 0.7)",
    gray: "rgba(142, 142, 147, 0.7)",
  };

  return (
    <span
      className={`macos-text-primary ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: colors[variant],
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {children}
    </span>
  );
};

// macOS Divider
export const MacOSDivider: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div
      className={className}
      style={{
        height: "1px",
        background: "rgba(255, 255, 255, 0.1)",
        margin: "12px 0",
      }}
    />
  );
};
