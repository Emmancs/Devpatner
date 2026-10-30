import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F17',
        surface: {
          50: '#1e2430',
          100: '#181d28',
          200: '#131822',
          DEFAULT: '#111722',
          border: '#1F293D',
        },
        brand: {
          blue: '#0EA5E9',
          indigo: '#6366F1',
          cyan: '#06B6D4',
        },
      },
    },
  },
  plugins: [],
};

export default config;

