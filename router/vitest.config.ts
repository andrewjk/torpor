import { defineConfig } from "vitest/config";
import tera from "../unplugin-tera/dist/vite";

export default defineConfig(({ mode }) => ({
  plugins: [tera()],
  resolve: {
    conditions: mode === "test" ? ["browser"] : [],
  },
  test: {
    environment: "jsdom",
  },
}));
