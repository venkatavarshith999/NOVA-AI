"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function ApiErrorBanner({ 
  message, 
  onRetry, 
  onDismiss 
}: { 
  message: string; 
  onRetry?: () => void; 
  onDismiss?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        >
          <div className="glass bg-unverified/10 dark:bg-unverified/20 border-unverified/20 dark:border-unverified/30 rounded-2xl p-4 shadow-lg shadow-unverified/5 flex gap-3 items-start backdrop-blur-xl">
            <div className="shrink-0 text-unverified mt-0.5">
              <AlertTriangle size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Connection Error
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {message}
              </p>
              
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-unverified hover:text-unverified/80 transition-colors"
                >
                  <RefreshCcw size={14} />
                  Retry Request
                </button>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
