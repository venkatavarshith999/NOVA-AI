"use client";

import Link from "next/link";
import { ShieldCheck, Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { isLoggedIn, logout } from "@/lib/auth";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function toggle() {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  }

  return (
    <button onClick={toggle} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div className="glass mx-4 mt-4 rounded-2xl px-6 py-3 flex items-center justify-between max-w-6xl lg:mx-auto">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-lg">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-white" size={18} />
          </span>
          Nova <span className="gradient-text">AI</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/#how-it-works" className="hover:text-primary transition-colors">
            How it works
          </Link>
          <Link href="/#agents" className="hover:text-primary transition-colors">
            Agents
          </Link>
          <Link href="/research" className="hover:text-primary transition-colors">
            Research
          </Link>
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/settings" className="hover:text-primary transition-colors">
                Settings
              </Link>
              <button onClick={logout} className="hover:text-red-500 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/signup" className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-sm hover:opacity-90 transition-opacity">
                Sign up
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
        
        {/* Mobile toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden glass mx-4 mt-2 rounded-2xl p-4 flex flex-col gap-4 text-sm font-medium dark:text-slate-200">
          <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</Link>
          <Link href="/#agents" onClick={() => setMobileMenuOpen(false)}>Agents</Link>
          <Link href="/research" onClick={() => setMobileMenuOpen(false)}>Research Now</Link>
          {loggedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
              <button onClick={logout} className="text-left text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
