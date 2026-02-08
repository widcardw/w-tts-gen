import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { VoiceInfo } from '../../bindings/bridgetts/services/nativeinvocation'

const [nativeStore, setNativeStore] = createStore<{
  leadingMsg: { msg: string; color: string }
  content: string
  outputPath: string
  errMsg: any
  isLoading: boolean
  finalAudioPath: string
  pathState: string
  voiceInfo: VoiceInfo[]
  voiceLangs: string[]
  selCate: string
  selLang: string
  selSpeaker: string
  isListening: boolean
  autoSlice: boolean
}>({
  leadingMsg: { msg: '', color: '' },
  content: '',
  outputPath: '',
  errMsg: null,
  isLoading: false,
  finalAudioPath: '',
  pathState: '',
  voiceInfo: [],
  voiceLangs: [],
  selCate: 'default',
  selLang: '',
  selSpeaker: '',
  isListening: false,
  autoSlice: true
})

class AppConfig {
  compress = false
  defaultSaveDir = ''
  theme = 'auto'
  constructor(source = {}) {
    Object.assign(this, source)
  }
  static createFrom(source = {}) {
    return new AppConfig(source)
  }
}

const [configStore, setConfigStore] = createStore<AppConfig>({
  compress: false,
  defaultSaveDir: '',
  theme: 'auto',
})

const [configChanged, setConfigChanged] = createSignal(false)

export { nativeStore, setNativeStore, configStore, setConfigStore, configChanged, setConfigChanged }
export { AppConfig }
