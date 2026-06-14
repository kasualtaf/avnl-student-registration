// tailwind.config.cjs
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d6efd',
        accent: '#6610f2',
        background: '#f8fafc',
        surface: '#ffffff',
      },
    },
  },
  plugins: [],
};
