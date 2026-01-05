import { createSignal } from 'solid-js'
import {Dialogs} from "@wailsio/runtime";
import {NativeTts} from "../bindings/bridgetts/services";

function App() {
  const [content, setContent] = createSignal('');
  const [outputPath, setOutputPath] = createSignal('');
  const [errMsg, setErrMsg] = createSignal()
  
  async function ChooseOutputDialog() {
    try {
      const selectedPath = await Dialogs.OpenFile({
        AllowsMultipleSelection: false,
        CanChooseDirectories: true,
        CanChooseFiles: false,
      });
      if (selectedPath) {
        setOutputPath(selectedPath + "/a.wav");
        // 这里可以调用你的TTS服务，将输出路径传给后端
        // 例如：NativeTts.Synthesize(text, selectedPath)
      } else {
        setOutputPath('');
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
    await NativeTts.GenerateSpeech(content(), outputPath())
  }

  return (
    <div class="container">
      <textarea value={content()} onInput={(e) => setContent(e.target.value)} autocomplete="false"></textarea>
      <div aria-label="outputPath" class="outputPath">{outputPath()}</div>
      <div>{String(errMsg())}</div>
      <div class="card">
        <div class="input-box" style="margin-top: 10px;">
          <button aria-label="choose-output-btn" class="btn" onClick={ChooseOutputDialog}>Choose</button>
        </div>
      </div>
      <button class="btn" onClick={generateTtsNative}>Generate</button>
    </div>
  )
}

export default App
