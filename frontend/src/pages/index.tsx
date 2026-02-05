import { Show, createMemo, onMount } from 'solid-js'
import { Dialogs } from '@wailsio/runtime'

import { nativeStore as ns, setNativeStore } from '~/stores/app'
import { NativeTts, OsService } from '#/bridgetts/services'
import { VoiceInfo } from '#/bridgetts/services/nativeinvocation'
import { Button } from '~/components/ui/Button'
import { Field, Switch, Tabs } from '@ark-ui/solid'

import '~/components/styles/input-field.css'
import '~/components/styles/radio-group.css'
import '~/components/styles/tabs.css'
import '~/components/styles/toast.css'
import switchStyles from '~/components/styles/switcher.module.css'

import { Selector } from '~/components/ui/Selector'

import { toaster } from '~/utils/toaster'

function Home() {
  async function getVoices() {
    const loadingToast = toaster.create({
      title: 'Loading Voices...',
      type: 'info',
      duration: 5000,
    })
    try {
      setNativeStore('isLoading', true)
      const voices: Array<VoiceInfo> = await NativeTts.GetVoices()
      setNativeStore('voiceInfo', voices)
      setNativeStore('voiceLangs', Array.from(new Set(voices.map((i) => i.lang))).sort())
      toaster.update(loadingToast, {
        title: 'Voices loaded successfully!',
        type: 'success',
        duration: 5000,
      })
    } catch (e) {
      toaster.update(loadingToast, {
        title: 'Error loading voices!',
        description: String(e),
        type: 'error',
      })
    } finally {
      setNativeStore('isLoading', false)
    }
  }

  const selectedVoice = createMemo(() => {
    if (ns.selCate === 'default') return undefined
    return ns.voiceInfo.find((i) => i.lang === ns.selLang && i.name === ns.selSpeaker)
  })

  onMount(async () => {
    if (ns.voiceInfo.length === 0) {
      await getVoices()
    }
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
        setNativeStore('outputPath', selectedPath)
      }
    } catch (err) {
      console.error('Error selecting file:', err)
      setNativeStore('outputPath', '')
      setNativeStore('errMsg', err)
      toaster.error({ description: String(err) })
    }
    await checkPathStat()
  }

  async function generateTtsNative() {
    if (ns.content.trim() === '' || ns.outputPath === '') {
      return
    }
    try {
      setNativeStore('isLoading', true)
      const audioPath = await NativeTts.GenerateSpeech(selectedVoice(), ns.content, ns.outputPath)
      setNativeStore('finalAudioPath', audioPath)
      toaster.create({
        description: (
          <>
            File saved at <span class="font-mono">{ns.finalAudioPath}</span>.{' '}
            <a
              class="cursor-pointer inline-flex items-center gap-1"
              onClick={async () => {
                try {
                  await OsService.OpenFolder(ns.finalAudioPath)
                } catch (e) {
                  console.log(e)
                  await OsService.OpenFolder(ns.outputPath)
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
      toaster.error({
        title: 'Error',
        description: String(err),
      })
    } finally {
      setNativeStore('isLoading', false)
    }
  }

  async function checkPathStat() {
    if (ns.outputPath.trim() == '') {
      setNativeStore('pathState', '')
      return
    }
    const stat = await OsService.PathStat(ns.outputPath)
    switch (stat) {
      case 'file': {
        setNativeStore('pathState', 'Selected a file. Generating TTS will overwrite the file.')
        break
      }
      case 'dir': {
        setNativeStore('pathState', 'Selected a folder. The TTS file will be put in the folder.')
        break
      }
      case 'empty': {
        setNativeStore('pathState', 'No folder/path Selected.')
        break
      }
      case 'non-exist': {
        setNativeStore('pathState', 'The folder does not exist. It will be created automatically.')
        break
      }
      default: {
        setNativeStore('pathState', `Caught error: ${stat}`)
      }
    }
  }

  async function tryListening() {
    try {
      setNativeStore('isListening', true)
      await NativeTts.TryListening(selectedVoice())
    } catch (e) {
      setNativeStore('errMsg', String(e))
      toaster.error({ description: String(e) })
    } finally {
      setNativeStore('isListening', false)
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      <Field.Root>
        <Field.Label>TTS Content</Field.Label>
        <Field.Textarea
          class="text-1rem py-1"
          autocomplete="false"
          value={ns.content}
          onInput={(e) => setNativeStore('content', e.target.value)}
          placeholder="Please input the text to synthesize..."
        />
      </Field.Root>
      
      <Switch.Root class={switchStyles.Root} checked={ns.autoSlice} onCheckedChange={(e) => setNativeStore('autoSlice', e.checked)}>
        <Switch.Control class={switchStyles.Control}>
          <Switch.Thumb class={switchStyles.Thumb} />
        </Switch.Control>
        <Switch.Label class={switchStyles.Label}>Auto Slice Texts</Switch.Label>
        <Switch.HiddenInput />
      </Switch.Root>

      <Field.Root>
        <Field.Label>Output Path/Directory</Field.Label>
        <div class="flex w-full gap-4">
          <Field.Input
            class="font-mono text-sm flex-1"
            value={ns.outputPath}
            onInput={(e) => setNativeStore('outputPath', e.target.value)}
            onBlur={checkPathStat}
          />
          <Button onClick={ChooseOutputDialog}>Choose</Button>
        </div>
        <Field.HelperText>
          {ns.pathState === '' && ns.outputPath.trim() === ''
            ? 'No folder selected.'
            : ns.pathState}
        </Field.HelperText>
      </Field.Root>

      <Tabs.Root
        defaultValue="default"
        value={ns.selCate}
        onValueChange={(v) => {
          setNativeStore('selCate', v.value)
          if (v.value === 'default') {
            setNativeStore('selLang', v.value || '')
            setNativeStore('selSpeaker', '')
          }
        }}
      >
        <Tabs.List>
          <Tabs.Trigger value="default">Default Speaker</Tabs.Trigger>
          <Tabs.Trigger value="manual">Manual Select</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Content value="default">
          This will invoke the default speaker of your platform (Siri for macOS, Cortana for
          Windows).
          <Button variant="ghost" disabled={ns.isListening || ns.isLoading} onClick={tryListening}>
            <div class="i-ri-volume-up-fill" />
          </Button>
        </Tabs.Content>
        <Tabs.Content value="manual">
          <Show when={ns.voiceInfo} fallback={<div>Loading...</div>}>
            <div class="flex gap-4 items-end">
              <Selector
                classNames="w-16rem"
                label="Locale"
                placeholder="Select Locale"
                value={ns.selLang}
                data={ns.voiceLangs.map((i) => ({ label: i, value: i }))}
                onValueChanged={(v) => setNativeStore('selLang', v.value[0])}
              />
              <Selector
                label="Speaker"
                classNames="w-30rem"
                placeholder="Select Speaker"
                value={ns.selSpeaker}
                data={ns.voiceInfo
                  .filter((i) => i.lang === ns.selLang)
                  .map((i) => ({ label: i.name, value: i.name }))}
                onValueChanged={(v) => setNativeStore('selSpeaker', v.value[0])}
              />
              <Button
                variant="ghost"
                disabled={
                  selectedVoice() === undefined || ns.selLang === '' || ns.selSpeaker === '' || ns.isListening
                }
                onClick={tryListening}
              >
                <div class="i-ri-volume-up-fill" />
              </Button>
            </div>
          </Show>
        </Tabs.Content>
      </Tabs.Root>

      <div class="flex justify-end">
        <Button
          onClick={generateTtsNative}
          disabled={ns.content.trim() === '' || ns.outputPath === '' || ns.isLoading}
        >
          Generate
        </Button>
      </div>
    </div>
  )
}

export default Home
