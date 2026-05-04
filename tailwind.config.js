/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        editorial: ['"Cormorant Garamond"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        night: {
          deepest: '#0a0f1e',
          dark: '#0d1b3e',
          mid: '#183282',
          blue: '#6C9EB3',
          light: '#a8d4e8',
        },
        gold: {
          soft: '#FCE997',
          DEFAULT: '#FFC52D',
          warm: '#e8a020',
        },
        paper: '#f0e6c8',
        ink: '#2a1f0e',
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'spin-slower': 'spin 8s linear infinite',
        'float': 'float 4s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'fade-up': 'fadeSlideUp 0.5s ease forwards',
      },
      backgroundImage: {
        'starry': "url('/starry.jpg')",
      }
    },
  },
  plugins: [],
}
