import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'persis-green': '#0A8F47',
        'persis-gold': '#B38B40',
      },
    },
  },
  plugins: [],
};
export default config;