/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gold': {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        'dark': {
          900: '#0F0F0F',
          950: '#0A0A0A',
        },
        // Discord風カラー
        discord: {
          bg: '#313338',
          sidebar: '#2b2d31',
          dark: '#1e1f22',
          hover: '#35373c',
          active: '#404249',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}