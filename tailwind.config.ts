import type { Config } from 'tailwindcss';

/**
 * Los colores de marca se leen desde variables CSS que inyecta
 * `src/app/layout.tsx` a partir de `src/config/site.ts`.
 * Para cambiar la identidad visual basta con editar esa configuración.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
        },
        paper: {
          DEFAULT: 'rgb(var(--color-paper) / <alpha-value>)',
          alt: 'rgb(var(--color-paper-alt) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
        },
        line: 'rgb(var(--color-line) / <alpha-value>)',
        /* HAROWI LEGAL CRM — identidad propia del sistema de gestión (/crm) */
        navy: {
          50: '#F3F6FB',
          100: '#E4EAF4',
          200: '#C7D3E6',
          300: '#9AAECD',
          400: '#6482AE',
          500: '#3F6094',
          600: '#2B4A7C',
          700: '#1F3965',
          800: '#16294B',
          900: '#0F1F3C',
          950: '#09142A',
        },
        brand: {
          50: '#EEF4FD',
          100: '#DCE8FB',
          200: '#BCD3F7',
          300: '#8FB4F0',
          400: '#5C90E6',
          500: '#3B77DB',
          600: '#2A62C4',
          700: '#224FA0',
          800: '#1F4482',
        },
        canvas: '#F5F6F8',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 31, 60, 0.04), 0 1px 3px rgba(15, 31, 60, 0.05)',
        pop: '0 12px 32px -8px rgba(15, 31, 60, 0.22), 0 2px 8px rgba(15, 31, 60, 0.08)',
        sheet: '-12px 0 40px -12px rgba(15, 31, 60, 0.25)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        overline: '0.18em',
      },
      maxWidth: {
        shell: '84rem',
        prose: '68ch',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'none' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.5s ease both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
