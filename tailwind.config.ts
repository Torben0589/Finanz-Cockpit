import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0f14",
        surface: "#121822",
        surface2: "#1a2230",
        border: "#232d3d",
        primary: "#3ddc97",
        primaryMuted: "#1f5c45",
        danger: "#ef4444",
        warning: "#f59e0b",
        text: "#e6edf3",
        textMuted: "#8b98a9"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
