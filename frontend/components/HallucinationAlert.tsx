"use client";

import { motion } from "framer-motion";
import { AlertOctagon } from "lucide-react";
import type { HallucinationFlag } from "@/lib/api";

export default function HallucinationAlert({ flag, index }: { flag: HallucinationFlag; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-2xl border border-unverified/30 bg-unverified/5 p-4 flex gap-3"
    >
      <AlertOctagon className="text-unverified shrink-0" size={20} />
      <div>
        <p className="font-semibold text-unverified text-sm mb-1">Hallucination Detected</p>
        <p className="text-sm text-slate-700 mb-1">{flag.claim_text}</p>
        <p className="text-xs text-slate-500">Reason: {flag.reason}</p>
      </div>
    </motion.div>
  );
}
