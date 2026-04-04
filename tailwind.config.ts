import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#5B8DEF',
          soft: '#BFD9FF',
          sky: '#D6ECFF',
          50: '#F0F7FF',
          100: '#D6ECFF',
          200: '#BFD9FF',
          300: '#93C3FC',
          400: '#5B8DEF',
          500: '#3B75E8',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        purple: {
          soft: '#E9D8FD',
          lavender: '#F3E8FF',
          100: '#F3E8FF',
          200: '#E9D8FD',
        },
        mint: {
          soft: '#C7F9CC',
          light: '#E8FFF1',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#1E293B',
          muted: '#64748B',
          light: '#94A3B8',
        },
      },
      borderRadius: {
        card: '20px',
        input: '14px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.06), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 4px 15px -3px rgba(0, 0, 0, 0.04)',
        card: '0 2px 12px -4px rgba(0, 0, 0, 0.06), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',
        neumorphic: '6px 6px 12px #e2e8f0, -6px -6px 12px #ffffff',
        'neumorphic-sm': '4px 4px 8px #e2e8f0, -4px -4px 8px #ffffff',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, #BFD9FF 0%, #D6ECFF 100%)',
        'gradient-purple': 'linear-gradient(135deg, #E9D8FD 0%, #F3E8FF 100%)',
        'gradient-mint': 'linear-gradient(135deg, #C7F9CC 0%, #E8FFF1 100%)',
        'gradient-primary': 'linear-gradient(135deg, #5B8DEF 0%, #3B75E8 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
