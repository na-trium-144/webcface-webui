// import { contextBridge } from "electron";
import "../../renderer.d.ts";

window.electronAPI = {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    // 関数だけでなく変数も公開できます
  },
};
