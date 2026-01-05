import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import wails from "@wailsio/runtime/plugins/vite";

export default defineConfig({
  plugins: [solid(), wails("./bindings")],
  server: {
    port: 9245,
  },
  resolve: {
    alias: {
      "~": new URL("src", import.meta.url).href,
      "#": new URL("bindings", import.meta.url).href,
    },
  },
});
