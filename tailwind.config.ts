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
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        google: {
          blue: "#1a73e8",
          blueHover: "#1557b0",
          red: "#ea4335",
          yellow: "#fbbc04",
          green: "#34a853",
          surface: "#ffffff",
          subtle: "#f1f3f4",
        }
      },
      boxShadow: {
        'liquid-sm': '0 2px 8px -2px rgba(15, 23, 42, 0.04), 0 1px 4px -1px rgba(15, 23, 42, 0.02)',
        'liquid': '0 10px 30px -10px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        'liquid-lg': '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 8px 20px -4px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'liquid': '1.25rem',
        'liquid-lg': '1.75rem',
      }
    },
  },
  plugins: [],
};
export default config;
