import { createMemo, createSignal, onMount, Show, createEffect, on } from 'solid-js'
import { configStore, setConfigStore } from '../stores/app'
import { edgeStore as es, setEdgeStore } from '../stores/edge'
import { EdgeTtsService, OsService } from '#/bridgetts/services'
import { Voice } from '#/github.com/wujunwei928/edge-tts-go/edge_tts'
import { Dialogs } from '@wailsio/runtime'
import { Accessor } from 'solid-js'
import { Button } from '~/components/ui/Button'
import { Field, Slider, Switch } from '@ark-ui/solid'

import '~/components/styles/input-field.css'
import '~/components/styles/radio-group.css'
import '~/components/styles/tabs.css'
import '~/components/styles/slider.css'
import switchStyles from '~/components/styles/switcher.module.css'
import { Selector } from '~/components/ui/Selector'
import { useToaster } from '~/contexts/toaster'
import { saveConfig } from '~/utils/config'
import clsx from 'clsx'
import { chooseAndRead } from '~/utils/choose-txt'

function EdgeTts() {
  const toaster = useToaster()
  const [isLoading, setIsLoading] = createSignal(false)
  let generationToastId: string | undefined
  async function fetchVoices() {
    setIsLoading(true)
    const loadingToast = toaster.create({
      title: 'Loading Edge Voices...',
      type: 'info',
    })
    try {
      const voiceList: Voice[] = await EdgeTtsService.ListVoices(true)
      setEdgeStore('voiceInfo', voiceList)
      setEdgeStore('locales', Array.from(new Set(voiceList.map((i) => i.Locale))).sort())

      toaster.update(loadingToast, {
        title: 'Edge Voices Loaded Successfully',
        type: 'success',
        duration: 5000,
      })
    } catch (err) {
      console.error('Error listing voices:', err)
      toaster.update(loadingToast, {
        title: 'Error Listing Edge Voices',
        type: 'error',
        description: String(err),
      })
    } finally {
      setIsLoading(false)
    }
  }

  onMount(async () => {
    // 从已加载的 configStore 中读取 edgeAutoSlice 设置
    setEdgeStore('autoSlice', configStore.edgeAutoSlice)

    // 从配置中恢复选中的 locale 和 voice
    if (configStore.edgeSelectedLocale) {
      setEdgeStore('selLocale', configStore.edgeSelectedLocale)
    }
    if (configStore.edgeSelectedVoice) {
      setEdgeStore('selVoiceName', configStore.edgeSelectedVoice)
    }

    // 从后端加载 voices（使用缓存）
    if (es.voiceInfo.length === 0) {
      const voiceList: Voice[] = await EdgeTtsService.ListVoices(false)
      setEdgeStore('voiceInfo', voiceList)
      setEdgeStore('locales', Array.from(new Set(voiceList.map((i) => i.Locale))).sort())
    }
  })

  // 当选中 locale 或 voice 时，保存到配置
  function handleLocaleChange(locale: string) {
    setEdgeStore('selLocale', locale)
    setConfigStore('edgeSelectedLocale', locale)
    console.log('selected locale', configStore.edgeSelectedLocale)
    saveConfig(false)
  }

  function handleVoiceChange(voiceName: string) {
    setEdgeStore('selVoiceName', voiceName)
    setConfigStore('edgeSelectedVoice', voiceName)
    saveConfig(false)
  }

  const selectedVoice: Accessor<Voice> = createMemo(() => {
    return es.voiceInfo.find((i) => i.Locale === es.selLocale && i.ShortName === es.selVoiceName)
  })

  // Update progress toast when progress changes
  createEffect(on(
    () => [es.progress.finished, es.progress.total],
    ([finished, total]) => {
      if (generationToastId && total > 0 && finished <= total) {
        toaster.update(generationToastId, {
          title: 'Generating TTS...',
          description: (<>
            <div>Progress: {finished}/{total} segments completed</div>
            <div class="w-full rounded-3px h-5px bg-border flex">
              <div class="bg-primary rounded-3px h-5px" style={{
                'width': `${finished/total * 100}%`
              }} />
            </div>
          </>),
          type: 'info',
        })
      }
    }
  ))

  async function ChooseOutputDialog() {
    try {
      const selectedPath = await Dialogs.OpenFile({
        AllowsMultipleSelection: false,
        CanChooseDirectories: true,
        CanChooseFiles: true,
        Title: 'Choose Output Path/Directory',
      })
      if (selectedPath) {
        setEdgeStore('outputPath', selectedPath)
      }
    } catch (err) {
      console.error('Error selecting file:', err)
      setEdgeStore('outputPath', '')
      setEdgeStore('errMsg', err)
      toaster.error({
        description: String(err),
      })
    }
    await checkPathStat()
  }

  async function checkPathStat() {
    if (es.outputPath.trim() == '') {
      setEdgeStore('pathState', '')
      return
    }
    const stat = await OsService.PathStat(es.outputPath)
    switch (stat) {
      case 'file': {
        setEdgeStore('pathState', 'Selected a file. Generating TTS will overwrite the file.')
        break
      }
      case 'dir': {
        setEdgeStore('pathState', 'Selected a folder. The TTS file will be put in the folder.')
        break
      }
      case 'empty': {
        setEdgeStore('pathState', 'No folder/path Selected.')
        break
      }
      case 'non-exist': {
        setEdgeStore('pathState', 'The folder does not exist. It will be created automatically.')
        break
      }
      default: {
        setEdgeStore('pathState', `Caught error: ${stat}`)
      }
    }
  }

  async function generateTtsEdge() {
    if (es.content.trim() === '' || es.outputPath === '') {
      return
    }
    try {
      setEdgeStore('isLoading', true)
      // Reset progress
      setEdgeStore('progress', { finished: 0, total: 0 })
      // Create generation progress toast
      generationToastId = toaster.create({
        title: 'Generating TTS...',
        description: 'Preparing to generate audio files...',
        type: 'info',
        duration: Infinity,
      })
      const audioPath = await EdgeTtsService.GenerateSpeech(
        selectedVoice(),
        (es.rate < 0 ? '' : '+') + es.rate + '%',
        (es.volume < 0 ? '' : '+') + es.volume + '%',
        (es.pitch < 0 ? '' : '+') + es.pitch + 'Hz',
        es.outputPath,
        es.content,
        es.autoSlice,
      )
      setEdgeStore('finalAudioPath', audioPath)
      // Update toast to success
      toaster.update(generationToastId, {
        title: 'TTS generated successfully!',
        description: (
          <>
            File saved at <span class="font-mono">{es.finalAudioPath}</span>.{' '}
            <a
              class="cursor-pointer inline-flex items-center gap-1"
              onClick={async () => {
                try {
                  await OsService.OpenFolder(es.finalAudioPath)
                } catch (e) {
                  console.log(e)
                  await OsService.OpenFolder(es.outputPath)
                }
              }}
            >
              Open <div class="w-3 h-3 i-ri-external-link-line" />
            </a>
          </>
        ),
        type: 'success',
        duration: 10000,
      })
    } catch (err) {
      // Update toast to error
      if (generationToastId) {
        toaster.update(generationToastId, {
          title: 'Error generating TTS',
          description: String(err),
          type: 'error',
          duration: 5000,
        })
      } else {
        toaster.error({
          title: 'Error',
          description: String(err),
        })
      }
    } finally {
      setEdgeStore('isLoading', false)
      generationToastId = undefined
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      <Field.Root>
        <Field.Label class="flex items-center gap-2">
          TTS Content
          <div
            class="i-ri-folder-5-line hover:text-primary cursor-pointer"
            onClick={async () => {
              const res = await chooseAndRead()
              if (res) setEdgeStore('content', res)
            }}
          />
        </Field.Label>
        <Field.Textarea
          class="text-1rem py-1"
          autocomplete="false"
          value={es.content}
          onInput={(e) => setEdgeStore('content', e.target.value)}
          placeholder="Please input the text to synthesize..."
        />
      </Field.Root>

      <div class="flex gap-6">
        <Switch.Root
          class={switchStyles.Root}
          checked={es.autoSlice}
          onCheckedChange={(e) => {
            setEdgeStore('autoSlice', e.checked)
            setConfigStore('edgeAutoSlice', e.checked)
            saveConfig(false, toaster)
          }}
        >
          <Switch.Control class={switchStyles.Control}>
            <Switch.Thumb class={switchStyles.Thumb} />
          </Switch.Control>
          <Switch.Label class={switchStyles.Label}>Auto Slice Texts</Switch.Label>
          <Switch.HiddenInput />
        </Switch.Root>
        <Button variant="ghost" disabled={isLoading()} onClick={fetchVoices}>
          <div class={clsx('i-ri-refresh-line', isLoading() && 'animate-spin')} />
          Refresh Voices
        </Button>
      </div>

      <Field.Root>
        <Field.Label>Output Path/Directory</Field.Label>
        <div class="flex w-full gap-4">
          <Field.Input
            class="font-mono text-sm flex-1"
            value={es.outputPath}
            onInput={(e) => setEdgeStore('outputPath', e.target.value)}
            onBlur={checkPathStat}
          />
          <Button onClick={ChooseOutputDialog}>Choose</Button>
        </div>
        <Field.HelperText>
          {es.pathState === '' && es.outputPath.trim() === ''
            ? 'No folder selected.'
            : es.pathState}
        </Field.HelperText>
      </Field.Root>

      <div class="flex gap-4 items-end">
        <Selector
          classNames="w-10rem"
          label="Locale"
          placeholder="Select Locale"
          value={es.selLocale}
          data={es.locales.map((i) => ({ label: i, value: i }))}
          onValueChanged={(v) => handleLocaleChange(v.value[0])}
        />
        <Selector
          label="Speaker"
          classNames="flex-1"
          placeholder="Select Speaker"
          value={es.selVoiceName}
          data={es.voiceInfo
            .filter((i) => i.Locale === es.selLocale)
            .map((i) => ({ label: i.FriendlyName, value: i.ShortName }))}
          onValueChanged={(v) => handleVoiceChange(v.value[0])}
        />
      </div>

      <Slider.Root
        min={-100}
        max={500}
        step={1}
        value={[es.rate]}
        onValueChange={(v) => setEdgeStore('rate', Number(v.value[0]))}
      >
        <Slider.Label>
          <span class="w-4rem">Rate</span>
          <div
            class="i-ri-reset-left-fill text-sm cursor-pointer hover:text-blue"
            onClick={() => setEdgeStore('rate', 0)}
          />
        </Slider.Label>
        <div class="font-mono text-sm w-4rem text-right">
          {es.rate > 0 && '+'}
          <Slider.ValueText />%
        </div>
        <div class="flex-1">
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0}>
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
          <Slider.MarkerGroup>
            <Slider.Marker value={-100}>-100</Slider.Marker>
            <Slider.Marker value={0}>0</Slider.Marker>
            <Slider.Marker value={100}>100</Slider.Marker>
            <Slider.Marker value={200}>200</Slider.Marker>
            <Slider.Marker value={300}>300</Slider.Marker>
            <Slider.Marker value={400}>400</Slider.Marker>
            <Slider.Marker value={500}>500</Slider.Marker>
          </Slider.MarkerGroup>
        </div>
      </Slider.Root>

      <Slider.Root
        min={-100}
        max={100}
        step={1}
        value={[es.volume]}
        onValueChange={(v) => setEdgeStore('volume', Number(v.value[0]))}
      >
        <Slider.Label>
          <span class="w-4rem">Volume</span>
          <div
            class="i-ri-reset-left-fill text-sm cursor-pointer hover:text-blue"
            onClick={() => setEdgeStore('volume', 0)}
          />
        </Slider.Label>
        <div class="font-mono text-sm w-4rem text-right">
          {es.volume > 0 && '+'}
          <Slider.ValueText />%
        </div>
        <div class="flex-1">
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0}>
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
          <Slider.MarkerGroup>
            <Slider.Marker value={-100}>-100</Slider.Marker>
            <Slider.Marker value={-50}>-50</Slider.Marker>
            <Slider.Marker value={0}>0</Slider.Marker>
            <Slider.Marker value={50}>50</Slider.Marker>
            <Slider.Marker value={100}>100</Slider.Marker>
          </Slider.MarkerGroup>
        </div>
      </Slider.Root>

      <Slider.Root
        min={-500}
        max={500}
        step={1}
        value={[es.pitch]}
        onValueChange={(v) => setEdgeStore('pitch', Number(v.value[0]))}
      >
        <Slider.Label>
          <span class="w-4rem">Pitch</span>
          <div
            class="i-ri-reset-left-fill text-sm cursor-pointer hover:text-blue"
            onClick={() => setEdgeStore('pitch', 0)}
          />
        </Slider.Label>
        <div class="font-mono text-sm w-4rem text-right">
          {es.pitch > 0 && '+'}
          <Slider.ValueText />
          Hz
        </div>
        <div class="flex-1">
          <Slider.Control>
            <Slider.Track>
              <Slider.Range />
            </Slider.Track>
            <Slider.Thumb index={0}>
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
          <Slider.MarkerGroup>
            <Slider.Marker value={-500}>-500</Slider.Marker>
            <Slider.Marker value={-400}>-400</Slider.Marker>
            <Slider.Marker value={-300}>-300</Slider.Marker>
            <Slider.Marker value={-200}>-200</Slider.Marker>
            <Slider.Marker value={-100}>-100</Slider.Marker>
            <Slider.Marker value={0}>0</Slider.Marker>
            <Slider.Marker value={100}>100</Slider.Marker>
            <Slider.Marker value={200}>200</Slider.Marker>
            <Slider.Marker value={300}>300</Slider.Marker>
            <Slider.Marker value={400}>400</Slider.Marker>
            <Slider.Marker value={500}>500</Slider.Marker>
          </Slider.MarkerGroup>
        </div>
      </Slider.Root>

      <div class="flex justify-end gap-4">
        <Show when={es.isLoading}>
          <Button
            variant="secondary"
            onClick={async () => {
              const confirm = await Dialogs.Question({
                Title: 'Force Stop',
                Message: 'Are you sure you want to stop the current generation?',
                Buttons: [
                  { Label: 'Stop', IsDefault: true, IsCancel: false },
                  { Label: 'Cancel', IsDefault: false, IsCancel: true },
                ],
              })
              if (confirm === 'Stop') {
                await EdgeTtsService.StopGeneration()
              }
            }}
          >
            <div class="i-ri-stop-line" />
            Force Stop
          </Button>
        </Show>
        <Button
          onClick={generateTtsEdge}
          disabled={es.content.trim() === '' || es.outputPath === '' || es.isLoading}
        >
          <Show
            when={es.progress.total !== 0 && es.progress.total !== es.progress.finished}
            fallback="Generate"
          >
            Generating
          </Show>
        </Button>
      </div>
    </div>
  )
}

export default EdgeTts
