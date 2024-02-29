import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@api": path.resolve(__dirname, "../api/src"),
    },
  },
  server: {
    proxy: {
      "/api": process.env.REACT_APP_API_HOST,
      "/public": process.env.REACT_APP_API_HOST,
      "/socket.io/": {
        target: process.env.GAME_SOCKET_SERVER_HOST,
        ws: true,
        // changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/socket.io/, ""),
      },
    },
  },
  plugins: [react()],
});
