import { defineConfig, presetIcons, presetWind3, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [presetWind3(), presetIcons()],
  transformers: [transformerDirectives()],
  theme: {
    fontFamily: {
      mono: 'var(--font-mono)',
      sans: 'var(--font-sans)',
    },
    colors: {
      primary: {
        DEFAULT: 'var(--color-primary)',
        foreground: 'var(--color-primary-foreground)',
      },
      secondary: {
        DEFAULT: 'var(--color-secondary)',
        foreground: 'var(--color-secondary-foreground)',
      },
      mut: {
        DEFAULT: 'var(--color-mut)',
        foreground: 'var(--color-mut-foreground)',
      },
      destructive: {
        DEFAULT: 'var(--color-destructive)',
        foreground: 'var(--color-destructive-foreground)',
      },
      // 背景和文本颜色
      bg: 'var(--color-bg)',
      text: 'var(--color-text)',
      border: 'var(--color-border)',
      // 输入框颜色
      'input-bg': 'var(--color-input-bg)',
      'input-text': 'var(--color-input-text)',
    },
  },
})
