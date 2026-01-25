/* @refresh reload */
import { render, Suspense } from 'solid-js/web'
import { Router } from '@solidjs/router'
import routes from '~solid-pages'
import Layout from './components/Layout'
import { onMount } from 'solid-js'
import { ConfigService } from '#/bridgetts/services'
import { AppConfig, setConfigStore, setNativeStore } from './stores/app'
import { setEdgeStore } from './stores/edge'
import { watchThemeIfAuto, changeTheme } from './utils/theme'

import 'virtual:uno.css'
import './styles/global.css'

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
          </Suspense>
        )}
      >
        {routes}
      </Router>
    )
  },
  document.getElementById('root') as HTMLElement,
)
