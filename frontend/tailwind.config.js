/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sc-bg': '#060e20',
        'sc-surface': '#081329',
        'sc-card': '#142449',
        'sc-border': '#1e2140',
        'sc-accent': '#7c3aed',
        'sc-accent-light': '#a855f7',
        'sc-accent-glow': '#c084fc',
        'sc-pink': '#ec4899',
        'sc-cyan': '#06b6d4',
        'sc-text': '#e2e8f0',
        'sc-muted': '#94a3b8',
        'sc-hover': '#1a1d35',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.25)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.25)',
        'glow-sm': '0 0 10px rgba(124, 58, 237, 0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(135deg, #7c3aed, #ec4899)',
        'gradient-card': 'linear-gradient(135deg, #13152a, #1a1d35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
