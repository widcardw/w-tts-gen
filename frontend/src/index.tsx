/* @refresh reload */
import { render, Suspense } from 'solid-js/web'
import { Router } from '@solidjs/router'
import routes from '~solid-pages'
import Layout from './components/Layout'
import './styles/global.css'
import 'virtual:uno.css'

render(
  () => {
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
