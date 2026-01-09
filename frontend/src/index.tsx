/* @refresh reload */
import { render, Suspense } from 'solid-js/web'
import { Router } from '@solidjs/router'
import routes from '~solid-pages'
import Layout from './components/Layout'
import { onMount } from 'solid-js'
import { ConfigService } from '../bindings/bridgetts/services'
import { AppConfig, setConfigStore, setNativeStore } from './stores/app'

import 'virtual:uno.css'
import './styles/global.css'

render(
  () => {
    onMount(async () => {
      const conf: AppConfig = await ConfigService.ReadConfig()
      setConfigStore(conf)
      setNativeStore('outputPath', conf.defaultSaveDir)
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
