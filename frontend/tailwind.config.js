/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#181A19',
        'primary-container': '#242725',
        'on-primary': '#FAF8F5',
        'secondary': '#595C59',
        'secondary-container': '#EFECE6',
        'on-secondary': '#181A19',
        'background': '#F9F7F2',
        'surface': '#FAF8F5',
        'surface-container': '#F5F2EB',
        'surface-container-low': '#FAF8F5',
        'surface-container-high': '#EFECE6',
        'surface-container-highest': '#E6E1D8',
        'on-surface': '#181A19',
        'on-surface-variant': '#595C59',
        'outline': '#BDB8AE',
        'outline-variant': '#E8E4DC',
        'error': '#BA1A1A'
      },
      fontFamily: {
        'display': ['Outfit', 'sans-serif'],
        'body': ['Manrope', 'sans-serif'],
        'label-ui': ['Space Grotesk', 'sans-serif'],
        'metric': ['Space Grotesk', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
