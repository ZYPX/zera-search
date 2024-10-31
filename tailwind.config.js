/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), customScrollbar],
}

function customScrollbar({ addUtilities }) {
  const newUtilities = {
    ".scrollbar-hide": {
      /* Hide scrollbar for Chrome, Safari and Opera */
      "&::-webkit-scrollbar": {
        display: "none",
      },
      /* Hide scrollbar for IE, Edge and Firefox */
      "&": {
        "-ms-overflow-style": "none" /* IE and Edge */,
        "scrollbar-width": "none" /* Firefox */,
      },
    },
    ".scrollbar-styled": {
      "&::-webkit-scrollbar": {
        width: "6px",
        height: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        "background-color": "#54a7ff",
        "border-radius": "5px",
      },
      "&::-webkit-scrollbar-track": {
        "background-color": "unset",
      },
    },
  };

  addUtilities(newUtilities, ["responsive", "hover"]);
}