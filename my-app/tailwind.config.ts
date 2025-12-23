import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FDFBF7",
        primary: "#88FFA1",
        secondary: "#FFEDA9",
        destructive: "#FF9B9B",
        accent: "#5499F8",
        ink: "#18181B",
      },
      boxShadow: {
        hard: "4px 4px 0px 0px #000000",
      },
      borderWidth: {
        3: "3px",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
