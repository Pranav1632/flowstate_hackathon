import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  colorScheme?: "emerald" | "amber" | "rose" | "cyan" | "slate";
}

export function StatCard({ label, value, icon, subtitle, colorScheme = "slate" }: StatCardProps) {
  const borderColors = {
    emerald: "border-emerald-500/30 text-emerald-400",
    amber: "border-amber-500/30 text-amber-400",
    rose: "border-rose-500/30 text-rose-400",
    cyan: "border-cyan-500/30 text-cyan-400",
    slate: "border-slate-800 text-slate-300",
  };

  return (
    <div className={`p-4 rounded-xl bg-slate-900/60 border ${borderColors[colorScheme]} backdrop-blur-sm shadow-sm flex flex-col justify-between`}>
      <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
        <span>{label}</span>
        {icon && <span className="opacity-80">{icon}</span>}
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}
