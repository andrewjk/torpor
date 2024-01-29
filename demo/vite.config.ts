import { defineConfig } from "vite";
import Tera from "../unplugin-tera/dist/vite";

export default defineConfig({
  plugins: [
    Tera({
      /* options */
    }),
  ],
});
