import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper-white)",
        pure: "var(--color-pure-white)",
        hairline: "var(--color-hairline)",
        ash: "var(--color-ash)",
        smoke: "var(--color-smoke)",
        graphite: "var(--color-graphite)",
        slate: "var(--color-slate)",
        stone: "var(--color-stone)",
        charcoal: "var(--color-charcoal)",
        obsidian: "var(--color-obsidian)",
        carbon: "var(--color-carbon)",
        "terminal-green": "var(--color-terminal-green)",
        gemini: {
          blue: "#1a73e8",
          violet: "#8b5cf6",
          pink: "#ec4899",
          cyan: "#06b6d4",
          surface: "#f8fafc",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        sm: "2px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        'email-card': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out forwards",
        shimmer: "shimmer 2.5s infinite linear",
        pulseGlow: "pulseGlow 2.5s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;

