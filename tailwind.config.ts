import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '380px',
      },
      colors: {
        saffron: {
          50: '#FFF4E6',
          100: '#FFE4C4',
          200: '#FFD09A',
          300: '#FFB370',
          400: '#FF9444',
          500: '#E76F00',
          600: '#C95E00',
          700: '#A24A00',
          800: '#7A3700',
          900: '#5C2900',
        },
        forest: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#4CAF50',
          500: '#1B5E20',
          600: '#154d18',
          700: '#0F3A12',
          800: '#0A2A0C',
          900: '#061806',
        },
        cream: {
          DEFAULT: '#FFF8F0',
          50: '#FFFDF9',
          100: '#FFF8F0',
          200: '#F8EFDD',
          300: '#F0E3C7',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#2C2A28',
        },
        ashoka: {
          DEFAULT: '#0E2A6B',
          light: '#1A3A87',
        },
        terracotta: '#B5482E',
      },
      fontFamily: {
        hindi: ['var(--font-devanagari)', 'serif'],
        'hindi-serif': ['var(--font-tiro)', 'var(--font-devanagari)', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.85)', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'draw-line': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.7s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'fade-in': 'fade-in 0.7s ease-out both',
        breath: 'breath 4.5s ease-in-out infinite',
        'spin-slow': 'spin-slow 32s linear infinite',
        'draw-line': 'draw-line 0.9s cubic-bezier(0.7, 0, 0.3, 1) both',
        shimmer: 'shimmer 8s ease-in-out infinite',
      },
      boxShadow: {
        stamp:
          '0 0 0 2px rgba(14, 42, 107, 0.85), 0 0 0 4px rgba(14, 42, 107, 0.15), inset 0 0 0 1px rgba(14, 42, 107, 0.4)',
        card: '0 1px 0 rgba(26,26,26,0.04), 0 24px 50px -28px rgba(60,30,0,0.18)',
        'card-hover':
          '0 1px 0 rgba(26,26,26,0.05), 0 36px 60px -30px rgba(60,30,0,0.25)',
        mic: '0 18px 42px -12px rgba(231,111,0,0.55), inset 0 1px 0 rgba(255,255,255,0.4), 0 0 0 1px rgba(231,111,0,0.15)',
      },
      backgroundImage: {
        'jali-pattern':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23E76F00' stroke-width='0.6' opacity='0.6'%3E%3Ccircle cx='40' cy='40' r='32'/%3E%3Ccircle cx='0' cy='0' r='32'/%3E%3Ccircle cx='80' cy='0' r='32'/%3E%3Ccircle cx='0' cy='80' r='32'/%3E%3Ccircle cx='80' cy='80' r='32'/%3E%3C/g%3E%3C/svg%3E\")",
        'paper-grain':
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
