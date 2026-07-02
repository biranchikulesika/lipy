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
        verdigris: {
          50: '#edf7f6',
          100: '#dbf0ed',
          200: '#b7e1db',
          300: '#93d2c8',
          400: '#6fc3b6',
          500: '#4bb4a4',
          600: '#3c9083',
          700: '#2d6c62',
          800: '#1e4842',
          900: '#0f2421',
          950: '#0b1917',
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
