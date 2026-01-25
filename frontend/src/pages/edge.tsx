import { createMemo, onMount, Show } from 'solid-js'
import { edgeStore as es, setEdgeStore } from '../stores/edge'
import { EdgeTtsService, OsService } from '#/bridgetts/services'
import { Voice } from '#/github.com/wujunwei928/edge-tts-go/edge_tts'
import { Dialogs } from '@wailsio/runtime'
import { Accessor } from 'solid-js'
import { Button } from '~/components/ui/Button'
import { Field, Slider } from '@ark-ui/solid'

import '~/components/styles/input-field.css'
import '~/components/styles/radio-group.css'
import '~/components/styles/tabs.css'
import '~/components/styles/slider.css'
import { Selector } from '~/components/ui/Selector'

function EdgeTts() {
  onMount(async () => {
    if (es.voiceInfo.length === 0) {
      const voiceList: Voice[] = await EdgeTtsService.ListVoices()
      setEdgeStore('voiceInfo', voiceList)
      setEdgeStore('locales', Array.from(new Set(voiceList.map((i) => i.Locale))).sort())
    }
  })

  const selectedVoice: Accessor<Voice> = createMemo(() => {
    return es.voiceInfo.find((i) => i.Locale === es.selLocale && i.ShortName === es.selVoiceName)
  })

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
      const audioPath = await EdgeTtsService.GenerateSpeech(
        selectedVoice(),
        (es.rate < 0 ? '' : '+') + es.rate + '%',
        (es.volume < 0 ? '' : '+') + es.volume + '%',
        (es.pitch < 0 ? '' : '+') + es.pitch + 'Hz',
        es.outputPath,
        es.content,
      )
      setEdgeStore('finalAudioPath', audioPath)
    } catch (err) {
      setEdgeStore('errMsg', err)
    } finally {
      setEdgeStore('isLoading', false)
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      <Field.Root>
        <Field.Label>TTS Content</Field.Label>
        <Field.Textarea
          class="text-1rem py-1"
          autocomplete="false"
          value={es.content}
          onInput={(e) => setEdgeStore('content', e.target.value)}
          placeholder="Please input the text to synthesize..."
        />
      </Field.Root>

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
          classNames="w-14rem"
          label="Locale"
          placeholder="Select Locale"
          value={es.selLocale}
          data={es.locales.map((i) => ({ label: i, value: i }))}
          onValueChanged={(v) => setEdgeStore('selLocale', v.value[0])}
        />
        <Selector
          label="Speaker"
          classNames="flex-1"
          placeholder="Select Speaker"
          value={es.selVoiceName}
          data={es.voiceInfo
            .filter((i) => i.Locale === es.selLocale)
            .map((i) => ({ label: i.FriendlyName, value: i.ShortName }))}
          onValueChanged={(v) => setEdgeStore('selVoiceName', v.value[0])}
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
        min={-10000}
        max={10000}
        step={100}
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
            <Slider.Marker value={-10000}>-10000</Slider.Marker>
            <Slider.Marker value={-5000}>-5000</Slider.Marker>
            <Slider.Marker value={0}>0</Slider.Marker>
            <Slider.Marker value={5000}>5000</Slider.Marker>
            <Slider.Marker value={10000}>10000</Slider.Marker>
          </Slider.MarkerGroup>
        </div>
      </Slider.Root>

      <Show when={es.errMsg}>
        <div class="p-3 bg-red/10 text-red border border-red/30 rounded-md">
          {String(es.errMsg)}
        </div>
      </Show>

      <div class="flex justify-end">
        <Button
          onClick={generateTtsEdge}
          disabled={es.content.trim() === '' || es.outputPath === '' || es.isLoading}
        >
          Generate
        </Button>
      </div>
      <Show when={es.finalAudioPath}>
        <div class="p-3 bg-green/10 text-green text-sm border border-green/30 rounded-md">
          File saved at <span class="font-mono">{es.finalAudioPath}</span>.{' '}
          <a
            onClick={async () => {
              try {
                await OsService.OpenFolder(es.finalAudioPath)
              } catch (e) {
                console.log(e)
                await OsService.OpenFolder(es.outputPath)
              }
            }}
            class="hover:underline cursor-pointer"
          >
            Open folder
          </a>
          .
        </div>
      </Show>
    </div>
  )
}

export default EdgeTts
