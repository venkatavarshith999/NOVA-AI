"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

export interface SourceData {
  title: string;
  url: string;
  content: string;
  score: number;
  source_name: string;
}

export default function SourceCard({ source }: { source: SourceData }) {
  const getDomain = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  const domain = getDomain(source.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  const getScoreColor = (score: number) => {
    if (score > 0.8) return "bg-verified";
    if (score > 0.5) return "bg-partial";
    return "bg-unverified";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}
      className="glass dark:bg-slate-900/60 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group transition-all"
    >
      <div className="flex items-center gap-2">
        <img src={faviconUrl} alt={domain} className="w-5 h-5 rounded-sm" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{domain}</span>
      </div>
      
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-display font-semibold text-lg text-slate-800 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2"
      >
        {source.title || source.source_name}
      </a>
      
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
        {source.content.length > 150 ? source.content.substring(0, 150) + "..." : source.content}
      </p>

      <div className="mt-auto pt-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${source.score * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className={clsx("h-full rounded-full", getScoreColor(source.score))}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {(source.score * 100).toFixed(0)}% Relevance
        </span>
      </div>
    </motion.div>
  );
}
