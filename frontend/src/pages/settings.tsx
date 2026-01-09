import clsx from 'clsx'
import {
  configStore as cs,
  setConfigStore,
  configChanged,
  setConfigChanged,
  AppConfig,
  configStore,
} from '../stores/app'
import { createSignal, Show } from 'solid-js'
import { ConfigService } from '../../bindings/bridgetts/services'

function Settings() {
  const [configSavedMsg, setConfigSavedMsg] = createSignal('')
  const [isLoading, setLoading] = createSignal(false)

  async function tryToSaveConfig() {
    setLoading(true)
    try {
      const msg = await ConfigService.WriteConfig(
        new AppConfig({
          compress: configStore.compress,
          defaultSaveDir: configStore.defaultSaveDir,
        }),
      )
      setConfigSavedMsg('Successfully saved at ' + msg)
      setConfigChanged(false)
    } catch (e) {
      setConfigSavedMsg(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="space-y-6">
      <div class={clsx('flex justify-between items-center', 'mx-4')}>
        <label>Compress</label>
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
            'focus:border-blue focus:ring-2 focus:ring-blue:30 rounded-md text-sm font-mono',
          )}
          value={cs.defaultSaveDir}
          onInput={(v) => {
            setConfigChanged(true)
            setConfigStore('defaultSaveDir', v.target.value)
          }}
        />
      </div>
      <div class={clsx('flex justify-end items-center mx-4 space-x-4')}>
        <Show when={configSavedMsg()}>
          <div class="bg-blue/10 text-blue p-2 rounded text-sm">{configSavedMsg()}</div>
        </Show>
        <button
          disabled={isLoading()}
          class={clsx(
            'block text-white text-sm rounded-md p-2',
            configChanged() ? 'bg-blue hover:bg-blue:80' : 'bg-gray hover:bg-gray:80',
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
