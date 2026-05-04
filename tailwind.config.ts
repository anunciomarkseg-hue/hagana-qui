import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hagana: {
          green: {
            950: '#061409',
            900: '#0A1E0E',
            800: '#0F2E14',
            700: '#144020',
            600: '#1A6B2E',
            500: '#228B38',
            400: '#2DB84B',
            300: '#4CD969',
            200: '#80E896',
            100: '#C5F5CF',
            50:  '#EDFBF1',
          },
          yellow: {
            600: '#C9A400',
            500: '#F5C800',
            400: '#FFD700',
            300: '#FFE454',
            200: '#FFF0A0',
            100: '#FFFAD6',
          },
          dark:  '#0B0B0C',
          dark2: '#0F1410',
        },
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'Montserrat', 'Inter', 'sans-serif'],
      },
      animation: {
        'glow-pulse':  'glowPulse 2.5s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
        'fade-up':     'fadeUp 0.5s ease-out forwards',
        'shimmer':     'shimmer 2s linear infinite',
        'scan':        'scan 2s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(45,184,75,0.35), 0 0 0 1px rgba(45,184,75,0.15)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(45,184,75,0.65), 0 0 20px rgba(245,200,0,0.25), 0 0 0 1px rgba(45,184,75,0.3)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(0%)',   opacity: '0.6' },
          '50%':       { transform: 'translateY(100%)', opacity: '1' },
        },
      },
      backgroundImage: {
        'green-gradient':  'linear-gradient(135deg, #1A6B2E 0%, #2DB84B 100%)',
        'yellow-gradient': 'linear-gradient(135deg, #C9A400 0%, #F5C800 50%, #FFD700 100%)',
        'dark-radial':     'radial-gradient(ellipse at 50% 0%, #0F2E14 0%, #0B0B0C 70%)',
        'shimmer-green':   'linear-gradient(90deg, transparent 0%, rgba(45,184,75,0.15) 50%, transparent 100%)',
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(45,184,75,0.4), 0 0 40px rgba(45,184,75,0.15)',
        'glow-yellow': '0 0 20px rgba(245,200,0,0.5),  0 0 40px rgba(245,200,0,0.2)',
        'glass':       '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}

export default config
