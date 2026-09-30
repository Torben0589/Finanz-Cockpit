import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#17171b",
        surface2: "#222226",
        surface3: "#2b2b31",
        border: "#303038",
        primary: "#ff6b35",
        primaryHover: "#ff7d4f",
        primaryMuted: "#3b1e15",
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#22c55e",
        text: "#fafafa",
        textMuted: "#a1a1aa"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem"
      },
      boxShadow: {
        card: "0 22px 60px rgba(0, 0, 0, 0.28)",
        accent: "0 14px 32px rgba(255, 107, 53, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
