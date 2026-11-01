/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        niyat: {
          bg: '#F3F1F8',
          card: '#FFFFFF',
          primary: '#663A91',
          'primary-hover': '#552F7A',
          'primary-light': '#F3EDF9',
          purple: '#663A91',
          'purple-dark': '#552F7A',
          'purple-light': '#F3EDF9',
          plum: '#351B4D',
          'plum-dark': '#261633',
          text: '#261633',
          muted: '#766B82',
          border: '#E8E2EF',
          hover: '#ECE7F4',
          success: '#168451',
          'success-light': '#E8F6EE',
          warning: '#D99A32',
          'warning-light': '#FDF5E7',
          danger: '#D64C55',
          'danger-light': '#FBEDED'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(38, 22, 51, 0.04)',
        card: '0 2px 8px -2px rgba(53, 27, 77, 0.06), 0 1px 3px 0 rgba(53, 27, 77, 0.04)',
        elevated: '0 8px 20px -4px rgba(53, 27, 77, 0.12), 0 3px 6px -2px rgba(53, 27, 77, 0.06)',
        plum: '0 8px 24px -4px rgba(53, 27, 77, 0.25)',
      }
    },
  },
  plugins: [],
}
