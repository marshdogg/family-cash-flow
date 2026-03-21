import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        purple: {
          50: "#F8F6FF",
          100: "#F0EBFF",
          200: "#DDD6FE",
          500: "#7B2FFF",
          600: "#6521D9",
        },
        blue: {
          100: "#E8F2FF",
          500: "#4A9BFF",
        },
        positive: {
          DEFAULT: "#22C55E",
          light: "#DCFCE7",
        },
        negative: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        dark: {
          surface: "#1E1B2E",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 12px rgba(123,47,255,0.08)",
        lg: "0 8px 24px rgba(123,47,255,0.12)",
        glow: "0 0 20px rgba(123,47,255,0.15)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7B2FFF 0%, #6C63FF 50%, #4A9BFF 100%)",
        "gradient-hero": "linear-gradient(160deg, #7B2FFF 0%, #4A9BFF 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          "0%": { opacity: "0.4" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out forwards",
        "count-up": "count-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
