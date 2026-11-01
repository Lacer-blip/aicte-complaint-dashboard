import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1B3A6B',
        pageBg: '#F4F6FA',
        cardBorder: '#DDE3EE',
        status: {
          onTrack: '#1E7B4F',
          approaching: '#B7791F',
          overdue: '#B3261E',
          paused: '#5B6B86'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;