/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#121212',
          surface: '#181818',
          accent: '#1DB954',
          muted: '#B3B3B3',
        },
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
