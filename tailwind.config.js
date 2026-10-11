/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bgMain: '#0B0F19',
        brandGreen: '#10B981',
        brandViolet: '#8B5CF6',
      },
    },
  },
  plugins: [],
}
