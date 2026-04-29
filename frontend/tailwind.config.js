/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        // Charte graphique Vert Clair & Blanc — MediAgent
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        mint: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        clinical: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Aliases pour rétro-compatibilité
        'emerald-light': '#d1fae5',
        'emerald-soft': '#6ee7b7',
        'emerald-deep': '#047857',
      },
      boxShadow: {
        'emerald-sm': '0 1px 3px rgba(16, 185, 129, 0.08)',
        'emerald': '0 4px 12px rgba(16, 185, 129, 0.12)',
        'emerald-lg': '0 10px 30px rgba(16, 185, 129, 0.15)',
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.25)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'glow-green': 'glow-green 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'glow-green': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}

