/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF0000',
        secondary: '#1E40AF',
        accent: '#EF4444',
      },
    },
  },
  plugins: [],
}
