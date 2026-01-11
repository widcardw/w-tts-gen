import clsx from 'clsx'
import {
  configStore as cs,
  setConfigStore,
  configChanged,
  setConfigChanged,
  AppConfig,
  configStore,
  setNativeStore,
} from '../stores/app'
import { createSignal, Show } from 'solid-js'
import { ConfigService } from '../../bindings/bridgetts/services'
import { changeTheme } from '../utils/theme'
import { Dialogs } from '@wailsio/runtime'

function Settings() {
  const [configSavedMsg, setConfigSavedMsg] = createSignal('')
  const [configSaveErrorMsg, setConfigSaveErrorMsg] = createSignal('')
  const [isLoading, setLoading] = createSignal(false)

  async function tryToSaveConfig() {
    setLoading(true)
    try {
      const msg = await ConfigService.WriteConfig(
        new AppConfig({
          compress: configStore.compress,
          defaultSaveDir: configStore.defaultSaveDir,
          theme: configStore.theme,
        }),
      )
      setConfigSavedMsg('Successfully saved at ' + msg)
      setConfigChanged(false)
      setNativeStore('outputPath', configStore.defaultSaveDir)
    } catch (e) {
      setConfigSaveErrorMsg('Failed to save config! ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  function handleThemeChange(t: 'auto' | 'light' | 'dark') {
    setConfigStore('theme', t)
    setConfigChanged(true)
    changeTheme(t)
  }

  async function chooseDefaultPath() {
    try {
      const selectedPath = await Dialogs.OpenFile({
        AllowsMultipleSelection: false,
        CanChooseDirectories: true,
        CanChooseFiles: false,
        Directory: configStore.defaultSaveDir,
      })
      if (selectedPath.trim() !== '') {
        setConfigStore('defaultSaveDir', selectedPath)
        setConfigChanged(true)
      }
    } catch (e) {
      setConfigSaveErrorMsg('Failed to select path! ' + String(e))
    }
  }

  return (
    <div class="space-y-6">
      <div class={clsx('flex justify-between items-center', 'mx-4')}>
        <label>Theme</label>
        <div class="space-x-4 flex items-center">
          <div class="space-x-1 flex items-center">
            <input
              type="radio"
              id="theme-auto"
              name="theme"
              checked={cs.theme === 'auto'}
              onClick={() => handleThemeChange('auto')}
            />
            <label for="theme-auto">Auto</label>
          </div>
          <div class="space-x-1 flex items-center">
            <input
              type="radio"
              id="theme-light"
              name="theme"
              checked={cs.theme === 'light'}
              onClick={() => handleThemeChange('light')}
            />
            <label for="theme-light">Light</label>
          </div>
          <div class="space-x-1 flex items-center">
            <input
              type="radio"
              id="theme-dark"
              name="theme"
              checked={cs.theme === 'dark'}
              onClick={() => handleThemeChange('dark')}
            />
            <label for="theme-dark">Dark</label>
          </div>
        </div>
      </div>
      <div class={clsx('flex justify-between items-center', 'mx-4')}>
        <label>
          Compress (The generated audio will be converted into <span class="font-mono">aac</span> format.)
        </label>
        <input
          type="checkbox"
          checked={cs.compress}
          onChange={(v) => {
            setConfigChanged(true)
            setConfigStore('compress', Boolean(v.target.checked))
          }}
        />
      </div>
      <div class={clsx('flex justify-between items-center space-x-4', 'mx-4')}>
        <label>Default Save Path</label>
        <input
          class={clsx(
            'block flex-1 p-2 bg-input-bg',
            'focus:border-blue focus:ring-2 focus:ring-blue/30 rounded-md text-sm font-mono',
          )}
          value={cs.defaultSaveDir}
          onInput={(v) => {
            setConfigChanged(true)
            setConfigStore('defaultSaveDir', v.target.value)
          }}
        />
        <button
          aria-label="choose-output-btn"
          class="bg-blue p-2 hover:bg-blue/80 text-white text-sm rounded-md"
          onClick={chooseDefaultPath}
        >
          Choose
        </button>
      </div>
      <div class={clsx('flex justify-end items-center mx-4 space-x-4')}>
        <Show when={configSavedMsg()}>
          <div class="bg-green/10 text-green p-2 rounded text-sm">{configSavedMsg()}</div>
        </Show>
        <Show when={configSaveErrorMsg()}>
          <div class="bg-red/10 text-red p-2 rounded text-sm">{configSavedMsg()}</div>
        </Show>
        <button
          disabled={isLoading()}
          class={clsx(
            'block text-white text-sm rounded-md p-2',
            configChanged() ? 'bg-blue hover:bg-blue/80' : 'bg-gray hover:bg-gray/80',
          )}
          onClick={tryToSaveConfig}
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default Settings
