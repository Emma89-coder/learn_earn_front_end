/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B2A',
        azure: '#00B0FF',
        gold: '#f6de94',
        teal: {
          50: '#E6F5F5',
          100: '#CCEBEB',
          200: '#99D6D6',
          300: '#66C2C2',
          400: '#33ADAD',
          500: '#008080',  // Your teal color
          600: '#006666',
          700: '#004D4D',
          800: '#003333',
          900: '#001A1A',
        },
      }
    },
  },
  plugins: [],
}