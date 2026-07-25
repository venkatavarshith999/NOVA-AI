"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ShieldCheck, AlertTriangle, Gauge, Link2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const FEATURES = [
  { icon: Search, title: "Multi-Agent AI", desc: "Five specialized agents research, verify, and report — not one model guessing alone." },
  { icon: ShieldCheck, title: "Fact Verification", desc: "Every claim is cross-checked against multiple independent sources." },
  { icon: AlertTriangle, title: "Hallucination Detection", desc: "Unsupported or fabricated claims are flagged with a clear reason." },
  { icon: Gauge, title: "Confidence Scores", desc: "Every claim carries a transparent 0–100% confidence score." },
  { icon: Link2, title: "Source Citations", desc: "Every verified claim links back to the sources that support it." },
];

const AGENTS = [
  { name: "Research Agent", desc: "Searches trusted sources via Tavily and extracts the key claims." },
  { name: "Verification Agent", desc: "Cross-checks each claim against multiple independent sources." },
  { name: "Hallucination Detection Agent", desc: "Flags unsupported, fabricated, or contradictory statements." },
  { name: "Confidence Scoring Agent", desc: "Scores every claim using source count, reliability, and agreement." },
  { name: "Report Generation Agent", desc: "Compiles a citation-backed report you can trust and share." },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-20 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-slate-600 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-verified animate-pulseGlow" />
            5 agents · live verification pipeline
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-7xl font-bold tracking-tight mb-5"
          >
            Nova <span className="gradient-text">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl font-medium text-slate-600 mb-3"
          >
            Autonomous Multi-Agent Research & Fact Verification System
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-slate-500 max-w-xl mx-auto mb-10"
          >
            Research with confidence using multiple AI agents that research, verify, detect
            hallucinations, and cite their sources — instead of one model guessing alone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link
              href="/research"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              Research Now <ArrowRight size={17} />
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-3 rounded-xl glass font-medium text-slate-700 hover:bg-white transition-colors"
            >
              Learn More
            </a>
          </motion.div>
        </section>

        {/* Feature cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pb-24">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass rounded-2xl p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                <f.icon size={19} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* How it works */}
        <section id="how-it-works" className="pb-24 scroll-mt-24">
          <h2 className="font-display text-3xl font-bold text-center mb-3">How it works</h2>
          <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">
            Your question passes through a chain of five agents, each with one job, before you
            ever see an answer.
          </p>
          <div id="agents" className="grid grid-cols-1 md:grid-cols-5 gap-4 scroll-mt-24">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass rounded-2xl p-5 relative"
              >
                <span className="font-display text-xs font-semibold text-primary/60 mb-2 block">
                  Stage {i + 1}
                </span>
                <h3 className="font-display font-semibold mb-1.5 text-sm">{a.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
                {i < AGENTS.length - 1 && (
                  <ArrowRight
                    size={16}
                    className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="pb-10 text-center text-xs text-slate-400">
          Built for the Gen AI hackathon — Nova AI
        </footer>
      </main>
    </>
  );
}
