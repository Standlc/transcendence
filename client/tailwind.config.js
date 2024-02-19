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
        primary: "rgb(88,100,242)",
        "bg-1": "#2b2d31",
        "bg-2": "#1e1f22",
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
        'bg-login': '#242424',
        'beige': '#ACADAC',
        'grey': '#4E5159'
      },
      boxShadow: {
        button: "0 5px 0px 0px rgba(0,0,0,0.5)",
        inset: "inset 0 -4px 0px 0px rgba(0,0,0,0.6)",
        card: "0 10px 5px -5px rgb(0 0 0 / 0.3)",
        "card-xl": "0 20px 8px -10px rgb(0 0 0 / 0.3)",
      },
      fontFamily: {
        // title: ['"Josefin Sans"', "sans-serif"],
        // title: ['"Tilt Warp"', "sans-serif"],
        // title: ['"Handjet"', "sans-serif"],
        title: ['"Gabarito"', "sans-serif"],
        // title: ['"Climate Crisis"', "sans-serif"],

        // gameFont: ['"blippo"', "system-ui"],
        gameFont: ['"Silkscreen"', "system-ui"],
        // gameFont: ['"Pixelify Sans"', "system-ui"],
        // gameFont: ['"Press Start 2P"', "system-ui"],
        // gameFont: ['"Monoton"', "system-ui"],
        // gameFont: ['"Bungee Shade"', "system-ui"],

        // paragraph: ['"Josefin Sans"', "sans-serif"],
      },
      fontSize: {
        clamp: "clamp(1rem, 3vw, 3rem)",
      },

      keyframes: {
        fadein: {
          "0%": {
            opacity: 0,
          },
          "100%": {
            opacity: 100,
          },
        },
        scalein: {
          "0%": {
            transform: "scale(0.9)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        "move-left-right": {
          "0%": {
            transform: "translate(-100%)",
          },
          "50%": {
            transform: "translate(100%)",
          },
          "100%": {
            transform: "translate(-100%)",
          },
        },
        showUpAndLeave: {
          "0%": {
            transform: "translate(0%, 200%)",
          },
          "10%": {
            transform: "translateY(200%)",
          },
          "30%": {
            transform: "translateY(0%)",
          },
          "90%": {
            transform: "translateY(0%)",
          },
          "100%": {
            transform: "translateY(200%)",
          },
        },
      },
      animation: {
        fadein: "fadein 0.3s cubic-bezier(0.7, 0, 0, 1)",
        scalein: "scalein 0.3s cubic-bezier(0.7, 0, 0, 1)",
        "slow-spin": "spin 6s linear infinite",
        "move-left-right":
          "move-left-right 3s cubic-bezier(0.7, 0, 0, 1) infinite",
        showUpAndLeave: "showUpAndLeave 4s cubic-bezier(0.7, 0, 0, 1) infinite",
      },
    },
  },
  plugins: [],
};
