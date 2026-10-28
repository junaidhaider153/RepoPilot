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
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        sm: "2px",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;

