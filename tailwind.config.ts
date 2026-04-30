import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'crm-silver': '#C4BBB8',
        'crm-pink-light': '#F5B0CB',
        'crm-pink': '#DC6ACF',
        'crm-purple': '#745C97',
        'crm-navy': '#39375B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-crm': 'linear-gradient(135deg, #39375B 0%, #745C97 50%, #DC6ACF 100%)',
        'gradient-card': 'linear-gradient(135deg, #745C97 0%, #DC6ACF 100%)',
        'gradient-light': 'linear-gradient(135deg, #F5B0CB 0%, #C4BBB8 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

export default config
