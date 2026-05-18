import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Siraa brand palette — exposed both as Tailwind classes and CSS vars
        brand: {
          bg: 'var(--brand-bg)', // #EEEEEE
          mint: 'var(--brand-mint)', // #6FCF97
          green: 'var(--brand-green)', // #2FA084
          deep: 'var(--brand-deep)', // #1F6F5F
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sinhala: ['var(--font-sinhala)', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', md: '2rem' },
        screens: { '2xl': '1400px' },
      },
    },
  },
  plugins: [],
};

export default config;
