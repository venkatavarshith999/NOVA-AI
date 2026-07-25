"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCcw size={18} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Home size={18} />
            Go Home
          </Link>
        </div>
      </main>
    </>
  );
}
