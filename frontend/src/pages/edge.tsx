import { createMemo, For, onMount, Show } from "solid-js";
import { edgeStore as es, setEdgeStore } from "../stores/edge";
import { EdgeTtsService, OsService } from "../../bindings/bridgetts/services";
import { Voice } from "../../bindings/github.com/wujunwei928/edge-tts-go/edge_tts";
import clsx from "clsx";
import { Dialogs } from "@wailsio/runtime";
import { Accessor } from "solid-js";

function EdgeTts() {
  onMount(async () => {
    if (es.voiceInfo.length === 0) {
      const voiceList: Voice[] = await EdgeTtsService.ListVoices();
      setEdgeStore("voiceInfo", voiceList);
      setEdgeStore(
        "locales",
        Array.from(new Set(voiceList.map((i) => i.Locale))),
      );
    }
  });

  const selectedVoice: Accessor<Voice> = createMemo(() => {
    return es.voiceInfo.find(
      (i) => i.Locale === es.selLocale && i.ShortName === es.selVoiceName,
    );
  });

  async function ChooseOutputDialog() {
    try {
      const selectedPath = await Dialogs.OpenFile({
        AllowsMultipleSelection: false,
        CanChooseDirectories: true,
        CanChooseFiles: true,
        Title: "Choose Output Path/Directory",
      });
      if (selectedPath) {
        setEdgeStore("outputPath", selectedPath);
      }
    } catch (err) {
      console.error("Error selecting file:", err);
      setEdgeStore("outputPath", "");
      setEdgeStore("errMsg", err);
    }
    await checkPathStat();
  }

  async function checkPathStat() {
    if (es.outputPath.trim() == "") {
      setEdgeStore("pathState", "");
      return;
    }
    const stat = await OsService.PathStat(es.outputPath);
    switch (stat) {
      case "file": {
        setEdgeStore(
          "pathState",
          "Selected a file. Generating TTS will overwrite the file.",
        );
        break;
      }
      case "dir": {
        setEdgeStore(
          "pathState",
          "Selected a folder. The TTS file will be put in the folder.",
        );
        break;
      }
      case "empty": {
        setEdgeStore("pathState", "No folder/path Selected.");
        break;
      }
      case "non-exist": {
        setEdgeStore(
          "pathState",
          "The folder does not exist. It will be created automatically.",
        );
        break;
      }
      default: {
        setEdgeStore("pathState", `Caught error: ${stat}`);
      }
    }
  }

  async function generateTtsEdge() {
    if (es.content.trim() === "" || es.outputPath === "") {
      return;
    }
    try {
      setEdgeStore("isLoading", true);
      const audioPath = await EdgeTtsService.GenerateSpeech(
        selectedVoice(),
        (es.rate < 0 ? "" : "+") + es.rate + "%",
        (es.volume < 0 ? "" : "+") + es.volume + "%",
        (es.pitch < 0 ? "" : "+") + es.pitch + "Hz",
        es.outputPath,
        es.content,
      );
      setEdgeStore("finalAudioPath", audioPath);
    } catch (err) {
      setEdgeStore("errMsg", err);
    } finally {
      setEdgeStore("isLoading", false);
    }
  }

  return (
    <div class="space-y-6 mx-auto">
      <div>
        <label for="content" class="block text-sm font-medium">
          TTS Content
        </label>
        <textarea
          id="content"
          value={es.content}
          onInput={(e) => setEdgeStore("content", e.target.value)}
          autocomplete="false"
          class={clsx(
            "w-full h-48 min-h-3rem max-h-20rem px-4 py-2 border border-border rounded-md text-sm",
            "bg-input-bg resize-y focus:border-blue focus:ring-2 focus:ring-blue/30",
          )}
          placeholder="Please input the text to synthesize..."
        ></textarea>
      </div>

      <div>
        <label for="output-path" class="block text-sm font-medium">
          Output Path/Directory
        </label>
        <div class="flex items-center space-x-2">
          <input
            id="output-path"
            aria-label="outputPath"
            class={clsx(
              "block flex-1 p-2 bg-input-bg",
              "focus:border-blue focus:ring-2 focus:ring-blue/30",
              "rounded-md text-sm font-mono",
            )}
            value={es.outputPath}
            onInput={(e) => setEdgeStore("outputPath", e.target.value)}
            onBlur={checkPathStat}
          />
          <button
            aria-label="choose-output-btn"
            class="bg-blue p-2 hover:bg-blue/80 text-white text-sm rounded-md"
            onClick={ChooseOutputDialog}
          >
            Choose
          </button>
        </div>
        <label class="block text-0.75rem font-light text-text">
          {es.pathState === "" && es.outputPath.trim() === ""
            ? "No folder selected."
            : es.pathState}
        </label>
      </div>

      <div class="flex items-center space-x-4">
        <label class="block text-sm font-medium">Speaker</label>
        <select
          name="locale"
          class="text-sm text-text"
          value={es.selLocale}
          onChange={(v) => setEdgeStore("selLocale", v.target.value)}
        >
          <option value="">Select Locale</option>
          <For each={es.locales}>
            {(lo) => <option value={lo}>{lo}</option>}
          </For>
        </select>

        <select
          name="voice"
          class="text-sm text-text"
          value={es.selVoiceName}
          onChange={(v) => setEdgeStore("selVoiceName", v.target.value)}
        >
          <option value="">Select Speaker</option>
          <For each={es.voiceInfo.filter((i) => i.Locale === es.selLocale)}>
            {(i) => <option value={i.ShortName}>{i.FriendlyName}</option>}
          </For>
        </select>
      </div>

      <div class="flex items-center space-x-4">
        <label class="block text-sm font-medium w-4rem">Rate</label>
        <div
          class="i-ri-reset-left-fill text-sm cursor-pointer hover:text-blue"
          onClick={() => setEdgeStore("rate", 0)}
        />
        <input
          type="range"
          class="flex-1"
          value={es.rate}
          min={-100}
          max={500}
          step={1}
          onInput={(v) => setEdgeStore("rate", Number(v.target.value))}
        />
        <code class="w-5rem text-right">
          {es.rate > 0 ? "+" : ""}
          {es.rate}%
        </code>
      </div>

      <div class="flex items-center space-x-4">
        <label class="block text-sm font-medium w-4rem">Volume</label>
        <div
          class="i-ri-reset-left-fill text-sm cursor-pointer hover:text-blue"
          onClick={() => setEdgeStore("volume", 0)}
        />
        <input
          type="range"
          class="flex-1"
          value={es.volume}
          min={-100}
          max={100}
          step={1}
          onInput={(v) => setEdgeStore("volume", Number(v.target.value))}
        />
        <code class="w-5rem text-right">
          {es.volume > 0 ? "+" : ""}
          {es.volume}%
        </code>
      </div>

      <div class="flex items-center space-x-4">
        <label class="block text-sm font-medium w-4rem">Pitch</label>
        <div
          class="i-ri-reset-left-fill text-sm cursor-pointer hover:text-blue"
          onClick={() => setEdgeStore("pitch", 0)}
        />
        <input
          type="range"
          class="flex-1"
          value={es.pitch}
          min={-10000}
          max={10000}
          step={100}
          onInput={(v) => setEdgeStore("pitch", Number(v.target.value))}
        />
        <code class="w-5rem text-right">
          {es.pitch > 0 ? "+" : ""}
          {es.pitch}Hz
        </code>
      </div>

      <Show when={es.errMsg}>
        <div class="p-3 bg-red/10 text-red border border-red/30 rounded-md">
          {String(es.errMsg)}
        </div>
      </Show>

      <div class="flex justify-end">
        <button
          class={clsx(
            "text-sm bg-blue hover:bg-blue-hover",
            "text-white rounded-md font-medium",
            "disabled:bg-gray disabled:cursor-not-allowed",
          )}
          onClick={generateTtsEdge}
          disabled={
            es.content.trim() === "" || es.outputPath === "" || es.isLoading
          }
        >
          Generate
        </button>
      </div>
      <Show when={es.finalAudioPath}>
        <div class="p-3 bg-green/10 text-green text-sm border border-green/30 rounded-md">
          File saved at <code>{es.finalAudioPath}</code>.{" "}
          <a
            onClick={async () => {
              try {
                await OsService.OpenFolder(es.finalAudioPath);
              } catch (e) {
                console.log(e);
                await OsService.OpenFolder(es.outputPath);
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
  );
}

export default EdgeTts;
