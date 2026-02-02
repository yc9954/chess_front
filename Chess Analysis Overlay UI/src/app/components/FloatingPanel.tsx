import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface FloatingPanelProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FloatingPanel({ children, className = '', delay = 0 }: FloatingPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`backdrop-blur-2xl bg-black/20 border border-white/10 rounded-2xl shadow-2xl ${className}`}
      style={{
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {children}
    </motion.div>
  );
}
