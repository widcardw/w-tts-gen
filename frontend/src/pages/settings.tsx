import { For } from 'solid-js'
import { configStore as cs, setConfigStore, configStore } from '~/stores/app'
import { ConfigService } from '#/bridgetts/services'
import { changeTheme } from '~/utils/theme'
import { Dialogs } from '@wailsio/runtime'
import { Button } from '~/components/ui/Button'
import { Field, RadioGroup } from '@ark-ui/solid'

import '~/components/styles/input-field.css'
import '~/components/styles/radio-group.css'
import { saveConfig, updateOutputPath } from '~/utils/config'

function Settings() {
  // const [isLoading, setLoading] = createSignal(false)

  const themeChoices = ['auto', 'light', 'dark']

  function handleThemeChange(t: 'auto' | 'light' | 'dark') {
    setConfigStore('theme', t)
    changeTheme(t)
    saveConfig()
  }
  // async function openDevTools() {
  //   await ConfigService.OpenDevTools()
  // }

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
        updateOutputPath(selectedPath)
        saveConfig()
      }
    } catch (e) {
      console.error('Failed to select path:', e)
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      {/* <div>
        <Button onClick={openDevTools}>Open DevTools</Button>
      </div> */}
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
      <Field.Root>
        <Field.Label>Default Save Path</Field.Label>
        <div class="flex gap-4 w-full">
          <Field.Input
            class="font-mono text-sm flex-1"
            value={cs.defaultSaveDir}
            onInput={(v) => {
              setConfigStore('defaultSaveDir', v.target.value)
              updateOutputPath(v.target.value)
              saveConfig()
            }}
          />
          <Button onClick={chooseDefaultPath}>Choose</Button>
        </div>
        <Field.HelperText>The default path to save your audios</Field.HelperText>
      </Field.Root>
      <div class="flex items-center justify-between">
        Config File <Button onClick={() => ConfigService.OpenConfigDir()}>Open</Button>
      </div>
    </div>
  )
}

export default Settings
