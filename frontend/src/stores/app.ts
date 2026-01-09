import { createStore } from 'solid-js/store'

const [nativeStore, setNativeStore] = createStore<{
  content: string
  outputPath: string
  errMsg: any
  isLoading: boolean
  finalAudioPath: string
}>({
  content: '',
  outputPath: '',
  errMsg: null,
  isLoading: false,
  finalAudioPath: '',
})

export { nativeStore, setNativeStore }
