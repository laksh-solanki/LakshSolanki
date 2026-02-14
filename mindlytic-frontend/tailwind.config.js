/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,jsx}"],
  theme: {
    extend: {
      colors: {
        "premium-dark": "#0f172a",
        "premium-accent": "#6366f1",
      },
    },
  },
  plugins: [],
};
