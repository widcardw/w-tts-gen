import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import wails from '@wailsio/runtime/plugins/vite'
import Pages from 'vite-plugin-pages'
import UnoCSS from 'unocss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    wails('./bindings'),
    Pages({
      dirs: ['src/pages'],
    }),
    UnoCSS(),
    solid(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '#': path.resolve(__dirname, 'bindings'),
    },
  },
})
