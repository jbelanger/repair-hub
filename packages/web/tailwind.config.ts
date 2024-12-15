import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0A0612', // Darker base
          lighter: '#1A0B38', // Slightly lighter for cards
          card: '#251348',    // Card backgrounds
        },
        purple: {
          50: '#F6F4FF',
          100: '#EDEBFF',
          200: '#D9D3FF',
          300: '#C4B8FF', // Brighter text
          400: '#A594FF',
          500: '#8C75FF', // Vibrant accent
          600: '#7C3AED', // Primary button
          700: '#5434FF',
          800: '#3F1DDB',
          900: '#2D0FB3',
          950: '#1A0B38',
        },
        gray: {
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        blue: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
        },
        accent: {
          purple: '#8C75FF',  // Primary accent
          pink: '#FF75D8',    // Secondary accent
          blue: '#75A5FF',    // Tertiary accent
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'gradient-radial-to-tr': 'radial-gradient(circle at top right, var(--tw-gradient-stops))',
        'gradient-radial-to-tl': 'radial-gradient(circle at top left, var(--tw-gradient-stops))',
        'gradient-radial-to-br': 'radial-gradient(circle at bottom right, var(--tw-gradient-stops))',
        'gradient-radial-to-bl': 'radial-gradient(circle at bottom left, var(--tw-gradient-stops))',
        'dot-pattern': 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
        'card-gradient': 'linear-gradient(to bottom right, rgba(37, 19, 72, 0.9), rgba(26, 11, 56, 0.9))',
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
      boxShadow: {
        'glow-sm': '0 2px 8px -2px rgba(140, 117, 255, 0.12)',
        'glow': '0 4px 16px -4px rgba(140, 117, 255, 0.18)',
        'glow-lg': '0 8px 24px -6px rgba(140, 117, 255, 0.24)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'success-appear': 'success-appear 0.3s ease-out forwards',
        'success-bounce': 'success-bounce 1s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
        'success-appear': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'success-bounce': {
          '0%, 100%': {
            transform: 'scale(1)',
          },
          '50%': {
            transform: 'scale(1.1)',
          },
        },
      },
      backgroundSize: {
        'dot-pattern': '24px 24px',
      },
    },
  },
  plugins: [],
} satisfies Config;
