/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#2563eb',
        accent: '#10b981',
        ink: '#0f172a',
        paper: '#ffffff',
      },
      fontFamily: {
        display: ['Libre Baskerville', 'serif'],
        body: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 45px -20px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};
