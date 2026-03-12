import { ConfigService } from '#/bridgetts/services'
import { AppConfig, configStore } from '~/stores/app'
import { setNativeStore } from '~/stores/app'
import { setEdgeStore } from '~/stores/edge'
import type { CreateToasterReturn } from '@ark-ui/solid/toast'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function saveConfig(verbose = true, toaster?: CreateToasterReturn) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(async () => {
    try {
      await ConfigService.WriteConfig(
        new AppConfig({
          defaultSaveDir: configStore.defaultSaveDir,
          theme: configStore.theme,
          nativeAutoSlice: configStore.nativeAutoSlice,
          nativeCompress: configStore.nativeCompress,
          edgeAutoSlice: configStore.edgeAutoSlice,
          edgeSelectedLocale: configStore.edgeSelectedLocale,
          edgeSelectedVoice: configStore.edgeSelectedVoice,
        }),
      )
      if (verbose && toaster) {
        toaster.create({
          title: 'Success',
          description: 'Config saved successfully',
          type: 'success',
        })
      }
    } catch (e) {
      if (toaster) {
        toaster.create({
          title: 'Error',
          description: `Failed to save config: ${String(e)}`,
          type: 'error',
        })
      }
    }
    debounceTimer = null
  }, 1000)
}

export function updateOutputPath(path: string) {
  setNativeStore('outputPath', path)
  setEdgeStore('outputPath', path)
}
