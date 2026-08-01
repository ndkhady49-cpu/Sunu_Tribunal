/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8f0fb',
          100: '#b5d4f4',
          500: '#1e3a6e',
          600: '#152a50',
          700: '#0d1f3c',
          900: '#080f1e',
        },
        justice: {
          50:  '#e6f5ee',
          100: '#b3dfc7',
          400: '#0f8a58',
          500: '#0a6640',
          600: '#084d30',
        },
        gold: {
          50:  '#fdf6e3',
          100: '#faecc0',
          400: '#c9a227',
          500: '#b08c1a',
        },
        danger: {
          50:  '#ffeaea',
          400: '#e8484e',
          600: '#b5242a',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(13,31,60,0.08)',
        'card-hover': '0 6px 24px rgba(13,31,60,0.14)',
        sos: '0 0 0 0 rgba(232,72,78,0.4)',
      },
      animation: {
        'pulse-sos': 'pulse-sos 2s infinite',
        'slide-in':  'slideIn 0.3s ease',
        'fade-in':   'fadeIn 0.25s ease',
        'blink':     'blink 1s infinite',
      },
      keyframes: {
        'pulse-sos': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(232,72,78,0.4)' },
          '50%':     { boxShadow: '0 0 0 20px rgba(232,72,78,0)' },
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        blink: {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0.3 },
        },
      },
    },
  },
  plugins: [],
}
