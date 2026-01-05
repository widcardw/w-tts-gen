import { createSignal, Show } from 'solid-js'
import {Dialogs} from "@wailsio/runtime";
import {NativeTts} from "../../bindings/bridgetts/services";
import clsx from 'clsx';

function Home() {
  const [content, setContent] = createSignal('');
  const [outputPath, setOutputPath] = createSignal('');
  const [errMsg, setErrMsg] = createSignal()
  const [isLoading, setIsLoading] = createSignal(false)
  
  async function ChooseOutputDialog() {
    try {
      const selectedPath = await Dialogs.OpenFile({
        AllowsMultipleSelection: false,
        CanChooseDirectories: true,
        CanChooseFiles: true,
      });
      if (selectedPath) {
        setOutputPath(selectedPath);
      }
    } catch (err) {
      console.error("Error selecting file:", err);
      setOutputPath('');
      setErrMsg(err)
    }
  }
  
  async function generateTtsNative() {
    if (content().trim() === "" || outputPath() === "") {
      return
    }
    try {
      setIsLoading(true)
      await NativeTts.GenerateSpeech(content(), outputPath())
    } catch (err) {
      setErrMsg(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      <div class="space-y-2">
        <label for="content" class="block text-sm font-medium text-text">TTS Content</label>
        <textarea 
          id="content"
          value={content()} 
          onInput={(e) => setContent(e.target.value)} 
          autocomplete="false"
          class="w-full h-48 p-4 border border-border rounded-md bg-input-bg text-input-text resize-y focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
          placeholder="Please input the text to synthesize..."
        ></textarea>
      </div>
      
      <div class="space-y-2">
        <label for="output-path" class="block text-sm font-medium text-text">Output Path/Directory</label>
        <div class="flex items-center space-x-2">
          <input 
            id="output-path"
            aria-label="outputPath" 
            class="block flex-1 p-2 bg-input-bg focus:border-primary focus:ring-2 focus:ring-primary/30 rounded-md text-text"
            value={outputPath()}
            onInput={(e) => setOutputPath(e.target.value)}
          />
          <button 
            aria-label="choose-output-btn" 
            class="block px-4 py-2 bg-secondary hover:bg-secondary-hover text-white rounded-md transition-colors"
            onClick={ChooseOutputDialog}
          >
            Choose
          </button>
        </div>
      </div>
      
      <Show when={errMsg()}>
        <div class="p-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
          {String(errMsg())}
        </div>
      </Show>
      
      <div class="flex justify-end">
        <button 
          class={clsx(
            "px-6 py-2 bg-primary hover:bg-primary-hover",
            "text-white rounded-md transition-colors font-medium",
            "disabled:bg-secondary disabled:cursor-not-allowed")}
          onClick={generateTtsNative}
          disabled={content().trim() === "" || outputPath() === "" || isLoading()}
        >
          Generate
        </button>
      </div>
    </div>
  )
}

export default Home
