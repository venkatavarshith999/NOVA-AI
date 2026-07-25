"use client";

import { motion } from "framer-motion";
import type { Report } from "@/lib/api";
import { useMemo } from "react";
import clsx from "clsx";

export default function ReportCharts({ report }: { report: Report }) {
  // Safe defaults
  const claims = report?.claims || [];
  const totalClaims = claims.length || 1; // avoid / 0
  
  const verifiedCount = claims.filter(c => c.verification.status === "verified").length;
  const partialCount = claims.filter(c => c.verification.status === "partially_verified").length;
  const unverifiedCount = claims.filter(c => c.verification.status === "not_verified").length;

  const getDomain = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  const sourcesDomains = useMemo(() => {
    const domains = new Map<string, number>();
    claims.forEach(c => {
      c.source_urls.forEach(url => {
        const d = getDomain(url);
        domains.set(d, (domains.get(d) || 0) + 1);
      });
    });
    return Array.from(domains.entries()).sort((a, b) => b[1] - a[1]);
  }, [claims]);

  const hallucinationCount = claims.filter(c => c.verification.status === "not_verified").length;
  const hallucinationPct = totalClaims > 0 ? (hallucinationCount / totalClaims) * 100 : 0;
  
  const getHallucinationColor = (pct: number) => {
    if (pct === 0) return "text-verified stroke-verified";
    if (pct < 25) return "text-partial stroke-partial";
    return "text-unverified stroke-unverified";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* 1. Verification Donut Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass dark:bg-slate-900/60 dark:border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center"
      >
        <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-100 mb-6 self-start">Verification Status</h3>
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
            
            {/* Verified (Green) */}
            <motion.circle
              cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12"
              className="text-verified"
              strokeDasharray={`${(verifiedCount / totalClaims) * 251.2} 251.2`}
              strokeDashoffset="0"
              initial={{ strokeDasharray: "0 251.2" }}
              whileInView={{ strokeDasharray: `${(verifiedCount / totalClaims) * 251.2} 251.2` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {/* Partial (Yellow) */}
            <motion.circle
              cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12"
              className="text-partial"
              strokeDasharray={`${(partialCount / totalClaims) * 251.2} 251.2`}
              strokeDashoffset={-((verifiedCount / totalClaims) * 251.2)}
              initial={{ strokeDasharray: "0 251.2" }}
              whileInView={{ strokeDasharray: `${(partialCount / totalClaims) * 251.2} 251.2` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
            {/* Unverified (Red) */}
            <motion.circle
              cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12"
              className="text-unverified"
              strokeDasharray={`${(unverifiedCount / totalClaims) * 251.2} 251.2`}
              strokeDashoffset={-(((verifiedCount + partialCount) / totalClaims) * 251.2)}
              initial={{ strokeDasharray: "0 251.2" }}
              whileInView={{ strokeDasharray: `${(unverifiedCount / totalClaims) * 251.2} 251.2` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-display font-bold text-slate-800 dark:text-slate-100">{claims.length}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Claims</span>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6 text-sm font-medium">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-verified"></div> <span className="text-slate-600 dark:text-slate-300">Verified</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-partial"></div> <span className="text-slate-600 dark:text-slate-300">Partial</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-unverified"></div> <span className="text-slate-600 dark:text-slate-300">Failed</span></div>
        </div>
      </motion.div>

      {/* 2. Confidence Distribution Bar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="glass dark:bg-slate-900/60 dark:border-slate-800 p-6 rounded-3xl flex flex-col"
      >
        <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4">Confidence Distribution</h3>
        <div className="flex-1 flex flex-col justify-center gap-3 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
          {claims.map((claim, idx) => (
            <div key={idx} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="truncate max-w-[200px]">{claim.text}</span>
                <span className="font-semibold">{claim.confidence.score}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${claim.confidence.score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={clsx(
                    "h-full rounded-full",
                    claim.confidence.band === "green" ? "bg-verified" : claim.confidence.band === "yellow" ? "bg-partial" : "bg-unverified"
                  )}
                />
              </div>
            </div>
          ))}
          {claims.length === 0 && <p className="text-sm text-slate-500 m-auto">No claims to display.</p>}
        </div>
      </motion.div>

      {/* 3. Hallucination Gauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="glass dark:bg-slate-900/60 dark:border-slate-800 p-6 rounded-3xl flex flex-col items-center justify-center"
      >
        <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-100 mb-6 self-start">Hallucination Index</h3>
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-[135deg]">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" strokeDasharray="188.5 251.2" />
            <motion.circle
              cx="50" cy="50" r="40" fill="transparent" strokeWidth="12" strokeLinecap="round"
              className={clsx(getHallucinationColor(hallucinationPct))}
              strokeDasharray="0 251.2"
              initial={{ strokeDasharray: "0 251.2" }}
              whileInView={{ strokeDasharray: `${(hallucinationPct / 100) * 188.5} 251.2` }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
            <span className={clsx("text-4xl font-display font-bold", getHallucinationColor(hallucinationPct).split(' ')[0])}>
              {hallucinationPct.toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center max-w-[200px]">
          {hallucinationPct === 0 ? "No hallucinations detected!" : "Some claims could not be verified."}
        </p>
      </motion.div>

      {/* 4. Sources Breakdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="glass dark:bg-slate-900/60 dark:border-slate-800 p-6 rounded-3xl flex flex-col"
      >
        <h3 className="font-display font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4">Top Sources</h3>
        <div className="flex flex-wrap gap-2">
          {sourcesDomains.map(([domain, count], idx) => (
            <motion.div
              key={domain}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              <img 
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`} 
                alt={domain}
                className="w-4 h-4 rounded-sm"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{domain}</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                {count}
              </span>
            </motion.div>
          ))}
          {sourcesDomains.length === 0 && <p className="text-sm text-slate-500">No sources available.</p>}
        </div>
      </motion.div>
    </div>
  );
}
