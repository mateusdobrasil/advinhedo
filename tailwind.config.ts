import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: { DEFAULT: "#13294B", deep: "#0C1B33", soft: "#1E3A66" },
        gold: { DEFAULT: "#C99A4B", light: "#E3C385", soft: "#F3E6CC" },
        sand: { DEFAULT: "#FAF7F1", warm: "#F2ECE1" },
        stone: { DEFAULT: "#5B6472", light: "#8A93A1" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: { soft: "0 18px 50px -20px rgba(12, 27, 51, 0.35)" },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { rise: "rise 0.8s ease-out both" },
    },
  },
  plugins: [],
};

export default config;