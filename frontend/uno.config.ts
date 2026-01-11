import { defineConfig, presetIcons, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3(), presetIcons()],
  theme: {
    fontFamily: {
      mono: 'Monaco,Menlo,Consolas,monospace',
    },
    colors: {
      primary: 'var(--color-primary)',
      'primary-hover': 'var(--color-primary-hover)',
      secondary: 'var(--color-secondary)',
      'secondary-hover': 'var(--color-secondary-hover)',
      mut: 'var(--color-mut)',
      'mut-hover': 'var(--color-mut-hover)',
      destructive: 'var(--color-destructive)',
      'destructive-hover': 'var(--color-destructive-hover)',
      success: 'var(--color-success)',
      'success-hover': 'var(--color-success-hover)',
      warning: 'var(--color-warning)',
      'warning-hover': 'var(--color-warning-hover)',
      info: 'var(--color-info)',
      'info-hover': 'var(--color-info-hover)',
      // 背景和文本颜色
      bg: 'var(--color-bg)',
      'bg-alt': 'var(--color-bg-alt)',
      text: 'var(--color-text)',
      'text-muted': 'var(--color-text-muted)',
      border: 'var(--color-border)',
      // 输入框颜色
      'input-bg': 'var(--color-input-bg)',
      'input-text': 'var(--color-input-text)',
    },
  },
})
