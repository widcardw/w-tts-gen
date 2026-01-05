import { Component, createSignal, For, onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';
import clsx from 'clsx';
import { OsService } from "../../bindings/bridgetts/services";

const Layout: Component<{ children: any }> = (props) => {
  const location = useLocation();
  
  const tabs = [
    { path: '/', label: 'Native TTS' },
    { path: '/edge', label: 'Edge TTS' },
  ];

  const [goos, setGoos] = createSignal<string>('');

  onMount(async () => {
    setGoos(await OsService.GetOs());
  })
  
  return (
    <div class="min-h-screen bg-bg">
      <header class="border-b border-border">
        <nav class="px-4">
          <div class={clsx("flex space-x-1", goos() === 'darwin' && 'ml-60px')}>
            <For each={tabs}>
              {tab => (
                <a
                  aria-key={tab.path}
                  href={tab.path}
                  class={clsx(
                    'px-4 py-2 rounded-t-md text-sm font-medium transition-colors border-b-2',
                    location.pathname === tab.path 
                    ? 'bg-bg-alt text-primary border-primary' 
                    : 'text-text-muted hover:text-primary border-transparent'
                  )}
                >
                  {tab.label}
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
  );
};

export default Layout;