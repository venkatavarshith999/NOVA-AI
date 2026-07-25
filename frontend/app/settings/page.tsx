"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { getUser } from "@/lib/auth";
import { Moon, Sun, Monitor, Save, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const user = getUser();
  const [theme, setTheme] = useState("system");
  const [geminiKey, setGeminiKey] = useState("");
  const [tavilyKey, setTavilyKey] = useState("");

  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "system");
    setGeminiKey(localStorage.getItem("nova_gemini_key") || "");
    setTavilyKey(localStorage.getItem("nova_tavily_key") || "");
  }, []);

  function handleThemeChange(val: string) {
    setTheme(val);
    if (val === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (val === "light") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      localStorage.removeItem("theme");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  function saveKeys() {
    localStorage.setItem("nova_gemini_key", geminiKey);
    localStorage.setItem("nova_tavily_key", tavilyKey);
    alert("API keys saved locally!");
  }

  function clearHistory() {
    if (confirm("Are you sure you want to clear all local app data? This cannot be undone.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Account */}
          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Account</h2>
            {user ? (
              <div className="space-y-2">
                <p><span className="font-medium text-slate-500">Name:</span> {user.name}</p>
                <p><span className="font-medium text-slate-500">Email:</span> {user.email}</p>
              </div>
            ) : (
              <p className="text-slate-500">You are not logged in.</p>
            )}
          </section>

          {/* Theme */}
          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">Appearance</h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${theme === "light" ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
              >
                <Sun size={24} className="mb-2" />
                <span className="font-medium">Light</span>
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${theme === "dark" ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
              >
                <Moon size={24} className="mb-2" />
                <span className="font-medium">Dark</span>
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${theme === "system" ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"}`}
              >
                <Monitor size={24} className="mb-2" />
                <span className="font-medium">System</span>
              </button>
            </div>
          </section>

          {/* API Keys */}
          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold mb-4">API Configuration</h2>
            <p className="text-sm text-slate-500 mb-4">Keys are stored securely in your browser's local storage.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1.5">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Tavily API Key</label>
                <input
                  type="password"
                  value={tavilyKey}
                  onChange={(e) => setTavilyKey(e.target.value)}
                  placeholder="tvly-..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <button onClick={saveKeys} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity">
              <Save size={18} />
              Save Keys
            </button>
          </section>

          {/* Data */}
          <section className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-red-500 mb-4">Danger Zone</h2>
            <p className="text-sm text-slate-500 mb-4">Clear all locally stored data, including settings and API keys.</p>
            <button onClick={clearHistory} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
              <Trash2 size={18} />
              Clear All Data
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
