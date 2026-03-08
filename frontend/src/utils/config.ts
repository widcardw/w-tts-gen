import { ConfigService } from '#/bridgetts/services'
import { AppConfig, configStore } from '~/stores/app'
import { setNativeStore } from '~/stores/app'
import { setEdgeStore } from '~/stores/edge'
import { toaster } from './toaster'

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function saveConfig() {
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
        }),
      )
      toaster.create({
        title: 'Success',
        description: 'Config saved successfully',
        type: 'success',
      })
    } catch (e) {
      toaster.create({
        title: 'Error',
        description: `Failed to save config: ${String(e)}`,
        type: 'error',
      })
    }
    debounceTimer = null
  }, 1000)
}

export function updateOutputPath(path: string) {
  setNativeStore('outputPath', path)
  setEdgeStore('outputPath', path)
}
