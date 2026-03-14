import { Show, createMemo, onMount, createEffect, on } from 'solid-js'
import { Browser, Dialogs } from '@wailsio/runtime'

import { nativeStore as ns, setNativeStore, configStore, setConfigStore } from '~/stores/app'
import { NativeTts, OsService } from '#/bridgetts/services'
import { VoiceInfo } from '#/bridgetts/services/nativeinvocation'
import { Button } from '~/components/ui/Button'
import { Field, Switch, Tabs } from '@ark-ui/solid'

import '~/components/styles/input-field.css'
import '~/components/styles/radio-group.css'
import '~/components/styles/tabs.css'
import switchStyles from '~/components/styles/switcher.module.css'

import { Selector } from '~/components/ui/Selector'

import { useToaster } from '~/contexts/toaster'
import { saveConfig } from '~/utils/config'
import { chooseAndRead } from '~/utils/choose-txt'

function Home() {
  const toaster = useToaster()
  let generationToastId: string | undefined

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

  // Update progress toast when progress changes
  createEffect(on(
    () => [ns.progress.finished, ns.progress.total],
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

  onMount(async () => {
    if (ns.voiceInfo.length === 0) {
      await getVoices()
    }

    // 从已加载的 configStore 中读取 autoSlice 和 compress 设置
    setNativeStore('autoSlice', configStore.nativeAutoSlice)
    if (await NativeTts.CheckFFmpegAvailable()) {
      setNativeStore('compress', configStore.nativeCompress)
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
      // Reset progress
      setNativeStore('progress', { finished: 0, total: 0 })
      // Create generation progress toast
      generationToastId = toaster.create({
        title: 'Generating TTS...',
        description: 'Preparing to generate audio files...',
        type: 'info',
        duration: Infinity,
      })
      const audioPath = await NativeTts.GenerateSpeech(
        selectedVoice(),
        ns.content,
        ns.outputPath,
        ns.autoSlice,
        ns.compress,
      )
      setNativeStore('finalAudioPath', audioPath)
      // Update toast to success
      toaster.update(generationToastId, {
        title: 'TTS generated successfully!',
        description: (
          <>
            File saved at <span class="font-mono break-all">{ns.finalAudioPath}</span>.{' '}
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
      // Update toast to error
      if (generationToastId) {
        toaster.update(generationToastId, {
          title: 'Error generating TTS',
          description: String(err),
          type: 'error',
          duration: Infinity,
        })
      } else {
        toaster.error({
          title: 'Error',
          description: String(err),
        })
      }
    } finally {
      setNativeStore('isLoading', false)
      generationToastId = undefined
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
        <Field.Label class="flex items-center gap-2">
          TTS Content
          <div
            class="i-ri-folder-5-line hover:text-primary cursor-pointer"
            onClick={async () => {
              const res = await chooseAndRead()
              if (res) setNativeStore('content', res)
            }}
          />
        </Field.Label>
        <Field.Textarea
          class="text-1rem py-1"
          autocomplete="false"
          value={ns.content}
          onInput={(e) => setNativeStore('content', e.target.value)}
          placeholder="Please input the text to synthesize..."
        />
      </Field.Root>

      <div class="flex gap-6">
          <Switch.Root
          class={switchStyles.Root}
          checked={ns.autoSlice}
          onCheckedChange={(e) => {
            setNativeStore('autoSlice', e.checked)
            setConfigStore('nativeAutoSlice', e.checked)
            saveConfig(false, toaster)
          }}
        >
          <Switch.Control class={switchStyles.Control}>
            <Switch.Thumb class={switchStyles.Thumb} />
          </Switch.Control>
          <Switch.Label class={switchStyles.Label}>Auto Slice Texts</Switch.Label>
          <Switch.HiddenInput />
        </Switch.Root>

        <Switch.Root
          class={switchStyles.Root}
          checked={ns.compress}
          onCheckedChange={async (e) => {
            if (e.checked) {
              // 检查 FFmpeg 是否可用
              const ffmpegAvailable = await NativeTts.CheckFFmpegAvailable()

              if (!ffmpegAvailable) {
                // FFmpeg 不可用，显示确认对话框
                const shouldOpen = await Dialogs.Question({
                  Title: 'FFmpeg 未找到',
                  Message: '要使用压缩功能，需要安装 FFmpeg。\n\n是否打开 FFmpeg 下载页面？',
                  Buttons: [
                    { Label: 'Yes', IsDefault: true, IsCancel: false },
                    { Label: 'No', IsDefault: false, IsCancel: true },
                  ],
                })

                if (shouldOpen === 'Yes') {
                  Browser.OpenURL('https://getffmpeg.org/')
                }
                // 不勾选选项
                setNativeStore('compress', false)
                return
              }
            }
            setNativeStore('compress', e.checked)
            setConfigStore('nativeCompress', e.checked)
            saveConfig(false, toaster)
          }}
        >
          <Switch.Control class={switchStyles.Control}>
            <Switch.Thumb class={switchStyles.Thumb} />
          </Switch.Control>
          <Switch.Label class={switchStyles.Label}>
            Compress (Convert to <span class="font-mono">aac</span> format)
          </Switch.Label>
          <Switch.HiddenInput />
        </Switch.Root>
      </div>

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
                  selectedVoice() === undefined ||
                  ns.selLang === '' ||
                  ns.selSpeaker === '' ||
                  ns.isListening
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
          <Show
            when={ns.progress.total !== 0 && ns.progress.total !== ns.progress.finished}
            fallback="Generate"
          >
            Generating
          </Show>
        </Button>
      </div>
    </div>
  )
}

export default Home
