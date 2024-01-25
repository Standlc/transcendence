/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundColor:{
        'discord-bg-login': '#5965F3',
        'discord-light-grey':  '#303339',
        'discord-dark-grey': '#2B2D31',
        'discord-light-black': '#1E1F22',
      },
      colors: {
        'discord-blue-link': '#0A8DCE',
        'blurple': '#5865F2',
        'blurple-hover': '#4652C5',
        'greyple': '#99AAB5',
        'dark-but-not-black': '#2C2F33',
        'not-quite-black': '#2B2D31',
        'green': '#57F287',        
        'discord-yellow': '#FEE75C',
        'discord-fuchsia': '#EB459E',
        'discord-red': '#ED4245',
        'discord-black': '#1E1F22',
        'almost-black': '#232529',
      },
    },
  },
  plugins: [],
};
