"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { UploadCloud, File as FileIcon, Loader2, X, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { API_BASE } from "@/lib/api";

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
}

export default function FileUpload({ onTextExtracted }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPT = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.txt";
  const ACCEPT_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "image/png", "image/jpeg", "text/plain"];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setSuccess(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
      setSuccess(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setSuccess(true);
      onTextExtracted(data.text);
    } catch (err: any) {
      setError(err?.message ?? "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-6"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={clsx(
          "glass rounded-2xl p-8 text-center border-2 border-dashed cursor-pointer transition-all duration-200",
          dragging
            ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]"
            : "border-slate-300 dark:border-slate-600 hover:border-primary/50",
          file && "cursor-default"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload-input"
        />

        {!file ? (
          <>
            <UploadCloud className="mx-auto text-slate-400 dark:text-slate-500 mb-3" size={36} />
            <h3 className="font-display font-semibold mb-1 text-slate-700 dark:text-slate-200">
              Upload a Document
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              PDF, DOCX, PNG, JPG, TXT
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              {success ? (
                <CheckCircle2 size={22} className="text-verified" />
              ) : (
                <FileIcon size={22} className="text-primary" />
              )}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!success && !loading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadFile();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Analyze
                </button>
              )}
              {loading && (
                <Loader2 size={20} className="animate-spin text-primary" />
              )}
              {success && (
                <span className="text-xs text-verified font-medium">Extracted!</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-unverified mt-2 text-center">{error}</p>
      )}
    </motion.div>
  );
}
