/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          primary: '#0F172A', // Deep charcoal navy
          'primary-hover': '#1E293B',
          accent: '#2563EB', // Vibrant trust blue
          'accent-hover': '#1D4ED8',
          'accent-light': '#EFF6FF',
          navy: '#0F172A',
          'navy-light': '#F1F5F9',
          text: '#0F172A',
          body: '#334155',
          muted: '#64748B',
          border: '#E2E8F0',
          hover: '#F8FAFC',
          success: '#16A34A',
          'success-light': '#F0FDF4',
          'success-border': '#BBF7D0',
          warning: '#D97706',
          'warning-light': '#FFFBEB',
          'warning-border': '#FDE68A',
          danger: '#DC2626',
          'danger-light': '#FEF2F2',
          'danger-border': '#FECACA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        elevated: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
