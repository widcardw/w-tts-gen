import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import wails from "@wailsio/runtime/plugins/vite";
import Pages from 'vite-plugin-pages'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    wails("./bindings"),
    Pages({
      dirs: ['src/pages']
    }),
    solid(), 
    UnoCSS()
  ],
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
