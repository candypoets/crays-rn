/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'base-100': 'rgb(var(--color-base-100) / <alpha-value>)',
        'base-200': 'rgb(var(--color-base-200) / <alpha-value>)',
        'base-300': 'rgb(var(--color-base-300) / <alpha-value>)',
        'base-content': 'rgb(var(--color-base-content) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        'paper-ink': 'rgb(var(--color-paper-ink) / <alpha-value>)',
        'paper-muted': 'rgb(var(--color-paper-muted) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
