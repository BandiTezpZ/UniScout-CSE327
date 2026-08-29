/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandNavy: '#0A1931',
        brandBlue: '#1976D2',
        brandSlate: '#78909C',
        brandWhite: '#ffffff',
        brandPaleBlue: '#E2F2FD',
        brandNavyLight: '#152C52',
        brandBlueLight: '#1E88E5',
        brandGrayBg: '#ffffff', // Canvas background pure white
      },
    },
  },
  plugins: [],
}
