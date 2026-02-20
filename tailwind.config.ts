import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primario)',
          secondary: 'var(--color-secundario)',
          accent: 'var(--color-acento)',
          text: 'var(--color-texto)',
          bg: 'var(--color-fondo)',
        },
      },
      spacing: {
        18: '4.5rem',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
