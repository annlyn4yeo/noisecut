import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#FAF8F4",
        ink: "#1a1a1a",
        signal: "#1660F5",
        muted: "#888888",
        faint: "#ede9e1",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)"],
        mono: ["var(--font-mono)"],
        sans: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
};
export default config;
