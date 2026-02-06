/* @refresh reload */
import { render, Suspense } from 'solid-js/web'
import { Router } from '@solidjs/router'
import routes from '~solid-pages'
import Layout from './components/Layout'
import { onMount, Show } from 'solid-js'
import { ConfigService } from '#/bridgetts/services'
import { AppConfig, setConfigStore, setNativeStore } from './stores/app'
import { setEdgeStore } from './stores/edge'
import { watchThemeIfAuto, changeTheme } from './utils/theme'

import 'virtual:uno.css'
import './styles/global.css'
import toastStyles from './components/styles/toast.module.css'
import { Toast, Toaster } from '@ark-ui/solid'
import { toaster } from './utils/toaster'

render(
  () => {
    onMount(async () => {
      const conf: AppConfig = await ConfigService.ReadConfig()
      setConfigStore('compress', conf.compress)
      setConfigStore('defaultSaveDir', conf.defaultSaveDir)
      setConfigStore('theme', conf.theme)
      setNativeStore('outputPath', conf.defaultSaveDir)
      setEdgeStore('outputPath', conf.defaultSaveDir)
      changeTheme(conf.theme as 'auto' | 'light' | 'dark')
      watchThemeIfAuto()
    })

    return (
      <Router
        root={(props) => (
          <Suspense>
            <Layout>{props.children}</Layout>
            <Toaster toaster={toaster}>
              {(toast) => (
                <Toast.Root class={toastStyles.Root}>
                  <Show when={toast().title}>
                    <Toast.Title class={toastStyles.Title}>{toast().title}</Toast.Title>
                  </Show>
                  <Show when={toast().description}>
                    <Toast.Description class={toastStyles.Description}>{toast().description}</Toast.Description>
                  </Show>
                  <Toast.CloseTrigger class={toastStyles.CloseTrigger}>
                    <div class="i-ri-close-line" />
                  </Toast.CloseTrigger>
                </Toast.Root>
              )}
            </Toaster>
          </Suspense>
        )}
      >
        {routes}
      </Router>
    )
  },
  document.getElementById('root') as HTMLElement,
)
