"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Link2 } from "lucide-react";
import clsx from "clsx";
import ConfidenceBadge from "./ConfidenceBadge";
import type { Claim } from "@/lib/api";

const STATUS_META = {
  verified: { label: "Verified", icon: CheckCircle2, color: "text-verified" },
  partially_verified: { label: "Partially Verified", icon: AlertTriangle, color: "text-partial" },
  not_verified: { label: "Not Verified", icon: XCircle, color: "text-unverified" },
} as const;

export default function ClaimCard({ claim, index }: { claim: Claim; index: number }) {
  const meta = STATUS_META[claim.verification.status];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="font-medium text-slate-800 leading-snug flex-1">{claim.text}</p>
        <span className={clsx("flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap", meta.color)}>
          <Icon size={15} />
          {meta.label}
        </span>
      </div>

      <p className="text-sm text-slate-500 mb-3">{claim.verification.reason}</p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ConfidenceBadge score={claim.confidence.score} band={claim.confidence.band} />
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link2 size={13} />
          {claim.source_urls.length} source{claim.source_urls.length !== 1 ? "s" : ""}
        </div>
      </div>

      {claim.source_urls.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/50 flex flex-wrap gap-2">
          {claim.source_urls.map((url) => {
            let domain = url;
            try {
              domain = new URL(url).hostname.replace(/^www\./, "");
            } catch {}
            
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors group max-w-[200px]"
              >
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} 
                  alt="" 
                  className="w-3.5 h-3.5 rounded-sm"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-primary truncate">
                  {domain}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
