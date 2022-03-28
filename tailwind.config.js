const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        chalk: ["Chalkboard", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "brand-pink": "var(--clr-pink)",
        "brand-yellow": "var(--clr-yellow)",
        "brand-green": "var(--clr-green)",
        "brand-white": "var(--clr-white)",
        "brand-background": "var(--clr-black)",
      },
      animation: {
        "pulse-slow": "pulse 10s linear infinite",
      },
    },
  },
  plugins: [],
};
