// import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { VoiceInfo } from '#/bridgetts/services/nativeinvocation'

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
  compress: boolean
  progress: {
    finished: number
    total: number
  }
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
  autoSlice: false,
  compress: false,
  progress: {
    finished: 0,
    total: 0,
  },
})

class AppConfig {
  defaultSaveDir = ''
  theme = 'auto'
  nativeAutoSlice = false
  nativeCompress = true
  edgeAutoSlice = false
  edgeCachedVoiceInfo: any[] = []
  edgeSelectedLocale = ''
  edgeSelectedVoice = ''
  constructor(source = {}) {
    Object.assign(this, source)
  }
  static createFrom(source = {}) {
    return new AppConfig(source)
  }
}

const [configStore, setConfigStore] = createStore<AppConfig>({
  defaultSaveDir: '',
  theme: 'auto',
  nativeAutoSlice: false,
  nativeCompress: true,
  edgeAutoSlice: false,
  edgeCachedVoiceInfo: [],
  edgeSelectedLocale: '',
  edgeSelectedVoice: '',
})

export { nativeStore, setNativeStore, configStore, setConfigStore }
export { AppConfig }
