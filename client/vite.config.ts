import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as dotenv from "dotenv";

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": process.env.REACT_APP_API_HOST,
      "/public": process.env.REACT_APP_API_HOST,
    },
  },
  plugins: [react()],
});
