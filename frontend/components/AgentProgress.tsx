"use client";

import { motion } from "framer-motion";
import { Search, ShieldCheck, AlertTriangle, Gauge, FileText, Loader2, Check, type LucideIcon } from "lucide-react";
import clsx from "clsx";

export interface StageStatus {
  key: string;
  label: string;
  detail: string;
  status: "pending" | "active" | "done";
}

const ICONS: Record<string, LucideIcon> = {
  research: Search,
  verification: ShieldCheck,
  hallucination_detection: AlertTriangle,
  confidence_scoring: Gauge,
  report_generation: FileText,
};

export default function AgentProgress({ stages, substeps = {} }: { stages: StageStatus[]; substeps?: Record<string, string[]> }) {
  const doneCount = stages.filter((s) => s.status === "done").length;
  const pct = Math.round((doneCount / stages.length) * 100);

  const allLogs = Object.entries(substeps).flatMap(([stageKey, msgs]) => 
    msgs.map(msg => ({ stageKey, msg }))
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
          <span>Agent pipeline running…</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-700/50 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {stages.map((stage, i) => {
          const Icon = ICONS[stage.key] ?? Search;
          const stageSubsteps = substeps[stage.key] || [];
          const isActive = stage.status === "active";
          const isDone = stage.status === "done";
          
          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={clsx(
                "glass dark:bg-slate-900/50 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 transition-colors",
                isActive && "ring-2 ring-primary/40 dark:ring-primary/40"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={clsx(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                    isDone && "bg-verified/10 text-verified",
                    isActive && "bg-gradient-to-br from-primary to-secondary text-white animate-pulseGlow",
                    stage.status === "pending" && "bg-slate-200/70 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500"
                  )}
                >
                  {isDone ? (
                    <Check size={20} />
                  ) : isActive ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={clsx(
                      "font-display font-semibold",
                      stage.status === "pending" ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
                    )}
                  >
                    {stage.label}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stage.detail}</p>
                </div>
              </div>

              {/* Substeps Log for active or done stages */}
              {(isActive || isDone) && stageSubsteps.length > 0 && (
                <div className="ml-15 pl-4 border-l-2 border-slate-200 dark:border-slate-700 flex flex-col gap-1.5 overflow-hidden">
                  {stageSubsteps.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                      <span className="truncate">{msg}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {allLogs.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass dark:bg-slate-900/60 dark:border-slate-800 rounded-2xl p-4"
        >
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <FileText size={14} /> Execution Log
          </h4>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {allLogs.map((log, idx) => (
              <div key={idx} className="text-xs font-mono text-slate-600 dark:text-slate-400 flex gap-2">
                <span className="text-slate-400 dark:text-slate-500 shrink-0">[{log.stageKey}]</span>
                <span className="break-words">{log.msg}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
