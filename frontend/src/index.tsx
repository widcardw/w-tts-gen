/* @refresh reload */
import { render, Suspense } from 'solid-js/web'
import { Router } from '@solidjs/router'
import routes from '~solid-pages'
import Layout from './components/Layout'
import { onCleanup, onMount, Show } from 'solid-js'
import { ConfigService } from '#/bridgetts/services'
import { AppConfig, setConfigStore, setNativeStore } from './stores/app'
import { setEdgeStore } from './stores/edge'
import { watchThemeIfAuto, changeTheme } from './utils/theme'

import 'virtual:uno.css'
import './styles/global.css'
import toastStyles from './components/styles/toast.module.css'
import { Toast, Toaster } from '@ark-ui/solid'

import { Events } from '@wailsio/runtime'
import { ToasterProvider, useToaster } from './contexts/toaster'

render(
  () => (
    <ToasterProvider>
      <App />
    </ToasterProvider>
  ),
  document.getElementById('root') as HTMLElement,
)

function App() {
  const toaster = useToaster()

  onMount(async () => {
    const conf: AppConfig = await ConfigService.ReadConfig()
    setConfigStore('nativeCompress', conf.nativeCompress)
    setConfigStore('nativeAutoSlice', conf.nativeAutoSlice)
    setConfigStore('edgeAutoSlice', conf.edgeAutoSlice)
    setConfigStore('defaultSaveDir', conf.defaultSaveDir)
    setConfigStore('theme', conf.theme)
    setConfigStore('edgeSelectedLocale', conf.edgeSelectedLocale)
    setConfigStore('edgeSelectedVoice', conf.edgeSelectedVoice)
    setNativeStore('outputPath', conf.defaultSaveDir)
    setEdgeStore('outputPath', conf.defaultSaveDir)
    changeTheme(conf.theme as 'auto' | 'light' | 'dark')
    watchThemeIfAuto()
  })

  // 注册事件监听器
  const cleanupNativeProgressListener = Events.On('progress:native', (data) => {
    console.log('event', data)
    setNativeStore('progress', 'finished', data.data.finished)
    setNativeStore('progress', 'total', data.data.total)
  })

  const cleanupEdgeProgressListener = Events.On('progress:edge', (data) => {
    console.log('event', data)
    setEdgeStore('progress', 'finished', data.data.finished)
    setEdgeStore('progress', 'total', data.data.total)
  })

  // 注册任务恢复事件
  const cleanupTaskRecoverListener = Events.On('task:recover', (data) => {
    console.log('recover task', data)
    // TODO: 实现任务恢复逻辑
  })

  // 组件卸载时清理监听器
  onCleanup(() => {
    cleanupNativeProgressListener()
    cleanupEdgeProgressListener()
    cleanupTaskRecoverListener()
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
                  <Toast.Description class={toastStyles.Description}>
                    {toast().description}
                  </Toast.Description>
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
}
