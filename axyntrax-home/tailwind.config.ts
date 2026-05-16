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
        axyntrax: {
          blue: "#00D4FF",
          purple: "#7000FF",
          dark: "#020617",
        }
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
export default config;
