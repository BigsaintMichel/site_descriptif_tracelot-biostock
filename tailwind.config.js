/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        night: '#07121F',
        navy: '#0F1E2E',
        panel: '#132638',
        rim: '#1E3349',
        mist: '#93A4B5',
        cloud: '#E8EEF3',
        paper: '#F5F7FA',
        ink: '#0F1E2E',
        slate: '#4A5A6B',
        forest: '#1B7A3E',
        emerald: '#10B981',
        laterite: '#C8643B',
        amber: '#F59E0B',
        danger: '#DC2626',
        signal: '#3B82F6',
      },
      fontFamily: {
        display: ['Manrope', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
};
