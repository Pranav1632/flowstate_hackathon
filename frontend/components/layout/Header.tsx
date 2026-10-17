import React from "react";
import { Shield, RefreshCw } from "lucide-react";

interface HeaderProps {
  onResetDemo: () => void;
  isResetting?: boolean;
}

export function Header({ onResetDemo, isResetting = false }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">RecallGuard</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
                ArmorIQ Governed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Supply Chain Recall Intelligence & Intent Verification Platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>
    </header>
  );
}
