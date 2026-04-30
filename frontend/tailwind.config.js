/** @type {import('tailwindcss').Config} */
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent:         '#b693a9',
        'accent-light': '#ceadb0',
        dark:           '#1c1828',
        btn:            '#3d2e35',
        'text-dark':    '#2e2028',
        'text-muted':   '#9c8a8e',
        border:         '#ddd0d4',
        'input-bg':     '#faf5f3',
        bg:             '#e8dfd8',
        light:          '#f0e8e2',
      },
      fontFamily: {
        serif: ['Gowun Batang', 'serif'],
      }
    }
  },
  plugins: [],
};