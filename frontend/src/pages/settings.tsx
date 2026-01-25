import { createSignal, For, Show } from 'solid-js'
import clsx from 'clsx'
import {
  configStore as cs,
  setConfigStore,
  configChanged,
  setConfigChanged,
  AppConfig,
  configStore,
  setNativeStore,
} from '~/stores/app'
import { setEdgeStore } from '~/stores/edge'
import { ConfigService } from '#/bridgetts/services'
import { changeTheme } from '~/utils/theme'
import { Dialogs } from '@wailsio/runtime'
import { Button } from '~/components/ui/Button'
import { Field, RadioGroup, Checkbox } from '@ark-ui/solid'

import '~/components/styles/input-field.css'
import '~/components/styles/radio-group.css'
import '~/components/styles/checkbox.css'

function Settings() {
  const [configSavedMsg, setConfigSavedMsg] = createSignal('')
  const [configSaveErrorMsg, setConfigSaveErrorMsg] = createSignal('')
  const [isLoading, setLoading] = createSignal(false)

  function hideMessageAfterDelay() {
    setTimeout(() => {
      setConfigSavedMsg('')
      setConfigSaveErrorMsg('')
    }, 10000)
  }

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
      setEdgeStore('outputPath', configStore.defaultSaveDir)
      hideMessageAfterDelay()
    } catch (e) {
      setConfigSaveErrorMsg('Failed to save config! ' + String(e))
      hideMessageAfterDelay()
    } finally {
      setLoading(false)
    }
  }

  const themeChoices = ['auto', 'light', 'dark']

  function handleThemeChange(t: 'auto' | 'light' | 'dark') {
    setConfigStore('theme', t)
    setConfigChanged(true)
    changeTheme(t)
  }
  async function openDevTools() {
    await ConfigService.OpenDevTools()
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
      hideMessageAfterDelay()
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      <div>
        <Button onClick={openDevTools}>Open DevTools</Button>
      </div>
      <RadioGroup.Root
        class="w-full"
        value={cs.theme}
        onValueChange={(v) => handleThemeChange(v.value as 'auto' | 'light' | 'dark')}
      >
        <RadioGroup.Label class="flex-1">Theme</RadioGroup.Label>
        <RadioGroup.Indicator />
        <For each={themeChoices}>
          {(it) => (
            <RadioGroup.Item value={it}>
              <RadioGroup.ItemControl />
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemText>{it}</RadioGroup.ItemText>
            </RadioGroup.Item>
          )}
        </For>
      </RadioGroup.Root>
      <Checkbox.Root
        class="w-full"
        checked={cs.compress}
        onCheckedChange={(e) => {
          setConfigChanged(true)
          setConfigStore('compress', Boolean(e.checked))
        }}
      >
        <Checkbox.Label class="flex-1">
          Compress (The generated audio will be converted into <span class="font-mono">aac</span>{' '}
          format.)
        </Checkbox.Label>
        <Checkbox.Control>
          <Checkbox.Indicator>
            <Show when={cs.compress}>
              <div class="i-ri-check-line text-white" />
            </Show>
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
      <Field.Root>
        <Field.Label>Default Save Path</Field.Label>
        <div class="flex gap-4 w-full">
          <Field.Input
            class="font-mono text-sm flex-1"
            value={cs.defaultSaveDir}
            onInput={(v) => {
              setConfigChanged(true)
              setConfigStore('defaultSaveDir', v.target.value)
            }}
          />
          <Button onClick={chooseDefaultPath}>Choose</Button>
        </div>
        <Field.HelperText>The default path to save your audios</Field.HelperText>
      </Field.Root>
      {/*<label>Default Save Path</label>
        <input
          class={clsx(
            "block flex-1 p-2 bg-input-bg",
            "focus:border-blue focus:ring-2 focus:ring-blue/30 rounded-md text-sm font-mono",
          )}
          value={cs.defaultSaveDir}
          onInput={(v) => {
            setConfigChanged(true);
            setConfigStore("defaultSaveDir", v.target.value);
          }}
        />*/}

      <div class={clsx('flex justify-end items-center space-x-4')}>
        <Button
          disabled={isLoading()}
          variant={configChanged() ? 'default' : 'secondary'}
          onClick={tryToSaveConfig}
        >
          Save
        </Button>
      </div>
      <div class="space-y-2">
        <Show when={configSavedMsg()}>
          <div class="bg-green/10 text-green p-2 rounded text-sm">{configSavedMsg()}</div>
        </Show>
        <Show when={configSaveErrorMsg()}>
          <div class="bg-red/10 text-red p-2 rounded text-sm">{configSaveErrorMsg()}</div>
        </Show>
      </div>
    </div>
  )
}

export default Settings
