import { Component, createSignal, For, onMount } from 'solid-js'
import { useLocation } from '@solidjs/router'
import clsx from 'clsx'
import { OsService } from '../../bindings/bridgetts/services'

const Layout: Component<{ children: any }> = (props) => {
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Native TTS', icon: 'i-ri-computer-line' },
    { path: '/edge', label: 'Edge TTS', icon: 'i-ri-edge-new-fill' },
  ]

  const [goos, setGoos] = createSignal<string>('')

  onMount(async () => {
    setGoos(await OsService.GetOs())
  })

  return (
    <div class="min-h-screen bg-bg">
      <header class="border-b border-border">
        <nav class="px-4">
          <div class={clsx('flex', goos() === 'darwin' && 'ml-60px')}>
            <For each={tabs}>
              {(tab) => (
                <a
                  aria-key={tab.path}
                  href={tab.path}
                  class={clsx(
                    'flex items-center space-x-2',
                    'px-4 py-2 rounded-t-md text-sm font-medium',
                    'border-b-2 border-t-2 border-t-transparent',
                    location.pathname === tab.path
                      ? 'bg-bg-alt text-primary border-primary'
                      : 'text-text-muted hover:text-primary border-transparent',
                  )}
                >
                  <div class={tab.icon} />
                  <span>{tab.label}</span>
                </a>
              )}
            </For>
          </div>
        </nav>
      </header>
      <main class="flex-1 container min-w-600px max-w-1200px mx-auto px-4 py-6">
        {props.children}
      </main>
    </div>
  )
}

export default Layout
