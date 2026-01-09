import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

const [nativeStore, setNativeStore] = createStore<{
  content: string;
  outputPath: string;
  errMsg: any;
  isLoading: boolean;
  finalAudioPath: string;
  pathState: string;
}>({
  content: "",
  outputPath: "",
  errMsg: null,
  isLoading: false,
  finalAudioPath: "",
  pathState: "",
});

class AppConfig {
  compress = false;
  defaultSaveDir = "";
  constructor(source = {}) {
    Object.assign(this, source);
  }
  static createFrom(source = {}) {
    return new AppConfig(source);
  }
}

const [configStore, setConfigStore] = createStore<AppConfig>({
  compress: false,
  defaultSaveDir: "",
});

const [configChanged, setConfigChanged] = createSignal(false);

export {
  nativeStore,
  setNativeStore,
  configStore,
  setConfigStore,
  configChanged,
  setConfigChanged,
};
export { AppConfig };
