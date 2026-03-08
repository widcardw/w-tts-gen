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
import { ConfigService, OsService } from '#/bridgetts/services'
import { changeTheme } from '~/utils/theme'
import { Browser, Dialogs } from '@wailsio/runtime'
import { Button } from '~/components/ui/Button'
import { Field, RadioGroup, Checkbox } from '@ark-ui/solid'

import '~/components/styles/input-field.css'
import '~/components/styles/radio-group.css'
import '~/components/styles/checkbox.css'
import { toaster } from '~/utils/toaster'

function Settings() {
  const [isLoading, setLoading] = createSignal(false)

  Dialogs.Question({
    Title: 'Are you sure?',
    Buttons: [{Label: 'Delete', IsDefault: false, IsCancel: false}, {'Label': 'No', IsDefault: true, IsCancel: true}],
    Message: 'Are you sure you want to delete it?',
  }).then((resLabel) => {
    if (resLabel === 'Delete') {
      console.log('Delete')
    }
  })

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
      toaster.create({
        title: 'Success',
        description: (
          <>
            Saved config at <code class="text-sm">{msg}</code>.{' '}
            <a
              class="cursor-pointer inline-flex items-center gap-1"
              onClick={async () => {
                await OsService.OpenFolder(msg)
              }}
            >
              Open <div class="w-3 h-3 i-ri-external-link-line" />
            </a>
          </>
        ),
        type: 'success',
      })
      setConfigChanged(false)
      setNativeStore('outputPath', configStore.defaultSaveDir)
      setEdgeStore('outputPath', configStore.defaultSaveDir)
    } catch (e) {
      toaster.create({
        title: 'Error',
        description: `Error occurred at ${String(e)}!`,
        type: 'error',
      })
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
        setConfigChanged(true)
      }
    } catch (e) {
      toaster.create({
        title: 'Error',
        description: 'Failed to select path! ' + String(e),
        type: 'error',
      })
    }
  }

  async function handleCompressChange(checked: boolean) {
    // 如果用户想要启用压缩
    if (checked) {
      // 检查 FFmpeg 是否可用
      const ffmpegAvailable = await ConfigService.CheckFFmpegAvailable()

      if (!ffmpegAvailable) {
        // FFmpeg 不可用，显示确认对话框
        const shouldOpen = await Dialogs.Question({
          Title: 'Cannot find FFmpeg',
          Message: 'If you want to enable compression, you need to install FFmpeg.\n\nDo you want to open the FFmpeg download page?',
          Buttons: [
            { Label: 'Yes', IsDefault: true, IsCancel: false },
            { Label: 'No', IsDefault: false, IsCancel: true },
          ]
        })

        if (shouldOpen) {
          // 打开 FFmpeg 下载页面
          Browser.OpenURL('https://getffmpeg.org/')
        }

        // 不勾选选项
        setConfigStore('compress', false)
        return
      }
    }

    // FFmpeg 可用或者用户想要关闭压缩，正常处理
    setConfigStore('compress', checked)
    setConfigChanged(true)
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
      <Checkbox.Root
        class="w-full"
        checked={cs.compress}
        onCheckedChange={(e) => handleCompressChange(Boolean(e.checked))}
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

      <div class={clsx('flex justify-end items-center space-x-4')}>
        <Button
          disabled={isLoading()}
          variant={configChanged() ? 'default' : 'secondary'}
          onClick={tryToSaveConfig}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default Settings
