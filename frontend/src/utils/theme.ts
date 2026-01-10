import { configStore } from '../stores/app'

function changeTheme(t: 'auto' | 'light' | 'dark') {
  const h5 = document.querySelector('html')

  switch (t) {
    case 'light': {
      if (!h5?.classList.contains('light')) {
        h5?.classList.add('light')
      }
      break
    }
    case 'dark': {
      h5?.classList.remove('light')
      break
    }
    default: {
      const mql = window.matchMedia('(prefers-color-scheme: light)')
      if (mql.matches) {
        h5?.classList.add('light')
      } else {
        h5?.classList.remove('light')
      }
    }
  }
}

function watchThemeIfAuto() {
  const h5 = document.querySelector('html')
  const mql = window.matchMedia('(prefers-color-scheme: light)')
  mql.addEventListener('change', ({ matches }) => {
    if (configStore.theme === 'auto') {
      if (matches) {
        if (!h5?.classList.contains('light')) {
          h5?.classList.add('light')
        }
      } else {
        h5?.classList.remove('light')
      }
    }
  })
}

export { changeTheme, watchThemeIfAuto }
