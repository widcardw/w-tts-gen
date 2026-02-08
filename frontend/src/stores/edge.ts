import { createStore } from 'solid-js/store'
import { Voice } from '../../bindings/github.com/wujunwei928/edge-tts-go/edge_tts'

const [edgeStore, setEdgeStore] = createStore<{
  leadingMsg: { msg: string; color: string }
  content: string
  outputPath: string
  errMsg: any
  isLoading: boolean
  finalAudioPath: string
  pathState: string
  voiceInfo: Voice[]
  locales: string[]
  selLocale: string
  selVoiceName: string
  rate: number
  volume: number
  pitch: number
  autoSlice: boolean
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
  locales: [],
  selLocale: '',
  selVoiceName: '',
  rate: 0,
  volume: 0,
  pitch: 0,
  autoSlice: false,
  progress: {
    finished: 0,
    total: 0,
  },
})

export { edgeStore, setEdgeStore }
