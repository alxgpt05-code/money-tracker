import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(0 0% 100% / 0.1)",
        input: "hsl(0 0% 100% / 0.08)",
        ring: "hsl(84 100% 59%)",
        background: "#090b08",
        foreground: "#f5f8f3",
        primary: {
          DEFAULT: "#b6ff4d",
          foreground: "#10130b",
        },
        secondary: {
          DEFAULT: "rgba(11,18,13,0.72)",
          foreground: "#eef4ec",
        },
        muted: {
          DEFAULT: "rgba(255,255,255,0.03)",
          foreground: "rgba(183,200,186,0.62)",
        },
        accent: {
          DEFAULT: "rgba(182,255,77,0.10)",
          foreground: "#d3ff95",
        },
        card: {
          DEFAULT: "rgba(16,23,18,0.72)",
          foreground: "#f5f8f3",
        },
        destructive: {
          DEFAULT: "#ff5d73",
          foreground: "#fff5f6",
        },
        chart: {
          1: "#b6ff4d",
          2: "#7ee787",
          3: "#8be9fd",
          4: "#facc15",
          5: "#fb7185",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(182,255,77,0.14), 0 20px 50px rgba(0,0,0,0.35)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 48px rgba(0,0,0,0.34)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(182,255,77,0.16), transparent 35%), radial-gradient(circle at 80% 20%, rgba(120,255,200,0.12), transparent 25%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
