import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#7C3AED",
        surface: "#F8FAFC",
        verified: "#16A34A",
        partial: "#D97706",
        unverified: "#DC2626",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% -10%, rgba(37,99,235,0.18), transparent 45%), radial-gradient(circle at 90% 10%, rgba(124,58,237,0.18), transparent 40%)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2.2s ease-in-out infinite",
        rise: "rise 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
