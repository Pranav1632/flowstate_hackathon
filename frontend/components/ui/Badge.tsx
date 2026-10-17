import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  const styles = {
    success: "bg-emerald-950/80 text-emerald-400 border-emerald-800/80",
    warning: "bg-amber-950/80 text-amber-400 border-amber-800/80",
    danger: "bg-rose-950/80 text-rose-400 border-rose-800/80",
    info: "bg-cyan-950/80 text-cyan-400 border-cyan-800/80",
    neutral: "bg-slate-800/80 text-slate-300 border-slate-700/80",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
