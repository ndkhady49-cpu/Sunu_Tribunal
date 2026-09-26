/** @type {import('tailwindcss').Config} */

// ── Charte « Encre & Or » ──────────────────────────────────
// Les noms historiques (navy, justice, gold, danger) sont conservés : seules les valeurs changent,
// ce qui fait évoluer toutes les pages sans renommer les classes.
const encre = {
  50:  '#EEF1F6',
  100: '#D5DCE8',
  200: '#B4BFD1',
  300: '#8594AD',
  400: '#4E5F7C',
  500: '#1C2B44',
  600: '#142033',
  700: '#0E1A2B',
  800: '#0A1422',
  900: '#070D17',
}
const baobab = {
  50:  '#EAF3EF',
  100: '#C7DFD5',
  200: '#A3CBBA',
  300: '#6FA891',
  400: '#2F7A62',
  500: '#1F5E4B',
  600: '#174637',
  700: '#11352A',
}
const bordeaux = {
  50:  '#F9ECEE',
  100: '#F1D5DA',
  200: '#E4B3BC',
  300: '#CF8593',
  400: '#A23446',
  500: '#8E2A3B',
  600: '#7A1F2B',
  700: '#651A24',
  800: '#4E141C',
  900: '#380E14',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    encre,
        justice: baobab,
        gold: {
          50:  '#FBF6EC',
          100: '#F1E4C6',
          200: '#E6D09E',
          300: '#D8BB7C',
          400: '#C9A45C',
          500: '#A8843F',
          600: '#86682F',
        },
        danger: bordeaux,
        // Neutres chauds : le fond ivoire (#F7F3EA) et les bordures fines (#E7E1D4) de la charte.
        // gray-400 et plus sont assombris pour un contraste WCAG AA sur fond blanc.
        gray: {
          50:  '#F7F3EA',
          100: '#EFE9DC',
          200: '#E7E1D4',
          300: '#D6CDBB',
          400: '#7D7566',
          500: '#6B6457',
          600: '#544E46',
          700: '#3D3833',
          800: '#26221E',
          900: '#141210',
        },
        // Les classes Tailwind natives suivent la charte : rouge → bordeaux, vert → baobab, bleu → encre
        red:   bordeaux,
        green: baobab,
        blue:  encre,
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['Manrope', 'system-ui', 'sans-serif'],
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl:    '12px',
        '2xl': '14px',
        '3xl': '20px',
      },
      boxShadow: {
        card:         '0 1px 2px rgba(14,26,43,0.04), 0 4px 16px rgba(14,26,43,0.04)',
        'card-hover': '0 2px 4px rgba(14,26,43,0.05), 0 10px 28px rgba(14,26,43,0.08)',
        sos:          '0 0 0 0 rgba(162,52,70,0.4)',
      },
      animation: {
        'pulse-sos': 'pulse-sos 2s infinite',
        'slide-in':  'slideIn 0.3s ease',
        'fade-in':   'fadeIn 0.25s ease',
        'blink':     'blink 1s infinite',
      },
      keyframes: {
        'pulse-sos': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(162,52,70,0.4)' },
          '50%':     { boxShadow: '0 0 0 20px rgba(162,52,70,0)' },
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
