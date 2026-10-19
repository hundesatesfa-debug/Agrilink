import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#fdf8f0',
          100: '#f5e6d3',
          200: '#e8c99b',
          300: '#d4a574',
          400: '#c48b52',
          500: '#a67037',
          600: '#8b5e2f',
          700: '#704b27',
          800: '#5c3d22',
          900: '#4a321c',
        },
      },
    },
  },
  plugins: [],
};
export default config;
