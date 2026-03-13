/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#EDEADE',
          sidebar: '#1A1A14',
          sidebarHover: '#2A2A1E',
          card: '#FFFFFF',
          cardBg: '#F7F5F0',
          cardHover: '#F0EDE4',
          border: '#E2DDD0',
          green: '#6B7C45',
          greenLight: '#8FA05A',
          greenMuted: '#E8EDD8',
          greenDark: '#4A5530',
          olive: '#5C6B38',
          cream: '#1A1A14',
          muted: '#8a8670',
          subtle: '#C5BFB0',
        },
        expiry: {
          today: '#C0392B',
          todayBg: '#FEE2E0',
          soon: '#C87941',
          soonBg: '#FEF4E4',
          fresh: '#6B7C45',
          freshBg: '#EEF4E4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
