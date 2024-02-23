/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
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
      colors: {
        primary: "rgb(88,100,242)",
        "bg-1": "#2b2d31",
        "bg-2": "#1e1f22",
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
        scalein: "scalein 0.3s cubic-bezier(0.7, 0, 0, 1.5)",
        "slow-spin": "spin 6s linear infinite",
        "move-left-right":
          "move-left-right 3s cubic-bezier(0.7, 0, 0, 1) infinite",
        showUpAndLeave: "showUpAndLeave 4s cubic-bezier(0.7, 0, 0, 1) infinite",
      },
    },
  },
  plugins: [],
};
