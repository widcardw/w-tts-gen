import { For, Show, createMemo, onMount } from "solid-js";
import { Dialogs } from "@wailsio/runtime";
import clsx from "clsx";

import { nativeStore as ns, setNativeStore } from "../stores/app";
import { NativeTts, OsService } from "../../bindings/bridgetts/services";
import { VoiceInfo } from "../../bindings/bridgetts/services/nativeinvocation";

function Home() {
  async function getVoices() {
    try {
      setNativeStore("isLoading", true);
      const voices: Array<VoiceInfo> = await NativeTts.GetVoices();
      setNativeStore("voiceInfo", voices);
      setNativeStore(
        "voiceLangs",
        Array.from(new Set(voices.map((i) => i.lang))),
      );
    } catch (e) {
      setNativeStore("errMsg", String(e));
    } finally {
      setNativeStore("isLoading", false);
    }
  }

  const selectedVoice = createMemo(() => {
    return ns.voiceInfo.find(
      (i) => i.lang === ns.selLang && i.name === ns.selSpeaker,
    );
  });

  onMount(async () => {
    await getVoices();
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
        setNativeStore("outputPath", selectedPath);
      }
    } catch (err) {
      console.error("Error selecting file:", err);
      setNativeStore("outputPath", "");
      setNativeStore("errMsg", err);
    }
    await checkPathStat();
  }

  async function generateTtsNative() {
    if (ns.content.trim() === "" || ns.outputPath === "") {
      return;
    }
    try {
      setNativeStore("isLoading", true);
      const audioPath = await NativeTts.GenerateSpeech(
        selectedVoice(),
        ns.content,
        ns.outputPath,
      );
      setNativeStore("finalAudioPath", audioPath);
    } catch (err) {
      setNativeStore("errMsg", err);
    } finally {
      setNativeStore("isLoading", false);
    }
  }

  async function checkPathStat() {
    if (ns.outputPath.trim() == "") {
      setNativeStore("pathState", "");
      return;
    }
    const stat = await OsService.PathStat(ns.outputPath);
    switch (stat) {
      case "file": {
        setNativeStore(
          "pathState",
          "Selected a file. Generating TTS will overwrite the file.",
        );
        break;
      }
      case "dir": {
        setNativeStore(
          "pathState",
          "Selected a folder. The TTS file will be put in the folder.",
        );
        break;
      }
      case "empty": {
        setNativeStore("pathState", "No folder/path Selected.");
        break;
      }
      case "non-exist": {
        setNativeStore(
          "pathState",
          "The folder does not exist. It will be created automatically.",
        );
        break;
      }
      default: {
        setNativeStore("pathState", `Caught error: ${stat}`);
      }
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
          value={ns.content}
          onInput={(e) => setNativeStore("content", e.target.value)}
          autocomplete="false"
          class={clsx(
            "w-full h-48 px-4 py-2 border border-border rounded-md text-sm",
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
            value={ns.outputPath}
            onInput={(e) => setNativeStore("outputPath", e.target.value)}
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
          {ns.pathState === "" && ns.outputPath.trim() === ""
            ? "No folder selected."
            : ns.pathState}
        </label>
      </div>

      <div>
        <label for="speaker" class="block text-sm font-medium">
          Speaker
        </label>
        <div class="flex items-center space-x-6">
          <div class="space-x-1 flex items-center">
            <input
              type="radio"
              id="speaker-default"
              name="speaker"
              checked={ns.selSpeaker === "" && ns.selLang === ""}
              onClick={() => {
                setNativeStore(["selLang", "selSpeaker"], "");
              }}
            />
            <label for="speaker-default">Default</label>
          </div>
          <div class="space-x-1 flex items-center">
            <input
              type="radio"
              id="speaker-manual"
              name="speaker"
              checked={ns.selSpeaker !== "" || ns.selLang !== ""}
            />
            <label for="speaker-manual">Manual Select</label>
            <Show when={ns.voiceInfo}>
              <div class="flex items-center space-x-4">
                <select
                  name="language"
                  class="text-sm"
                  value={ns.selLang}
                  onChange={(v) => setNativeStore("selLang", v.target.value)}
                >
                  <option value="">Please Select</option>
                  <For each={ns.voiceLangs}>
                    {(lang) => <option value={lang}>{lang}</option>}
                  </For>
                </select>
                <select
                  name="speaker-name"
                  class="text-sm"
                  value={ns.selSpeaker}
                  onChange={(v) => setNativeStore("selSpeaker", v.target.value)}
                >
                  <option value="">Please Select</option>
                  <For each={ns.voiceInfo.filter((i) => i.lang === ns.selLang)}>
                    {(speaker) => (
                      <option value={speaker.name}>{speaker.name}</option>
                    )}
                  </For>
                </select>
                <div
                  class="i-ri-volume-up-fill text-sm cursor-pointer hover:text-blue"
                  onClick={() => NativeTts.TryListening(selectedVoice())}
                />
              </div>
            </Show>
          </div>
        </div>
      </div>

      <Show when={ns.errMsg}>
        <div class="p-3 bg-red/10 text-red border border-red/30 rounded-md">
          {String(ns.errMsg)}
        </div>
      </Show>

      <div class="flex justify-end">
        <button
          class={clsx(
            "text-sm bg-blue hover:bg-blue-hover",
            "text-white rounded-md font-medium",
            "disabled:bg-gray disabled:cursor-not-allowed",
          )}
          onClick={generateTtsNative}
          disabled={
            ns.content.trim() === "" || ns.outputPath === "" || ns.isLoading
          }
        >
          Generate
        </button>
      </div>
      <Show when={ns.finalAudioPath}>
        <div class="p-3 bg-green/10 text-green text-sm border border-green/30 rounded-md">
          File saved at <code>{ns.finalAudioPath}</code>.{" "}
          <a
            onClick={async () => {
              try {
                await OsService.OpenFolder(ns.finalAudioPath)
              } catch (e) {
                console.log(e)
                await OsService.OpenFolder(ns.outputPath)
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

export default Home;
