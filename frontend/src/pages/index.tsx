import { Show } from 'solid-js'
import { Dialogs } from '@wailsio/runtime'
import { NativeTts, OsService } from '../../bindings/bridgetts/services'
import clsx from 'clsx'
import { nativeStore as ns, setNativeStore } from '../stores/app'

function Home() {
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
    }
  }

  async function generateTtsNative() {
    if (ns.content.trim() === '' || ns.outputPath === '') {
      return
    }
    try {
      setNativeStore('isLoading', true)
      const audioPath = await NativeTts.GenerateSpeech(ns.content, ns.outputPath)
      setNativeStore('finalAudioPath', audioPath)
    } catch (err) {
      setNativeStore('errMsg', err)
    } finally {
      setNativeStore('isLoading', false)
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      <div class="space-y-2">
        <label for="content" class="block text-sm font-medium text-text">
          TTS Content
        </label>
        <textarea
          id="content"
          value={ns.content}
          onInput={(e) => setNativeStore('content', e.target.value)}
          autocomplete="false"
          class="w-full h-48 px-4 py-2 border border-border rounded-md bg-input-bg text-input-text resize-y focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Please input the text to synthesize..."
        ></textarea>
      </div>

      <div class="space-y-2">
        <label for="output-path" class="block text-sm font-medium text-text">
          Output Path/Directory
        </label>
        <div class="flex items-center space-x-2">
          <input
            id="output-path"
            aria-label="outputPath"
            class="block flex-1 p-2 bg-input-bg focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-md text-sm font-mono"
            value={ns.outputPath}
            onInput={(e) => setNativeStore('outputPath', e.target.value)}
          />
          <button
            aria-label="choose-output-btn"
            class="block px-4 py-2 bg-secondary hover:bg-secondary-hover text-white rounded-md"
            onClick={ChooseOutputDialog}
          >
            Choose
          </button>
        </div>
      </div>

      <Show when={ns.errMsg}>
        <div class="p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
          {String(ns.errMsg)}
        </div>
      </Show>

      <div class="flex justify-end">
        <button
          class={clsx(
            'px-6 py-2 bg-primary hover:bg-primary-hover',
            'text-white rounded-md font-medium',
            'disabled:bg-secondary disabled:cursor-not-allowed',
          )}
          onClick={generateTtsNative}
          disabled={ns.content.trim() === '' || ns.outputPath === '' || ns.isLoading}
        >
          Generate
        </button>
      </div>
      <Show when={ns.finalAudioPath}>
        <div class="p-3 bg-success/10 text-success text-sm border border-success/30 rounded-md">
          File saved at <code>{ns.finalAudioPath}</code>.
          <a
            onClick={() => OsService.OpenFolder(ns.finalAudioPath)}
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

export default Home
