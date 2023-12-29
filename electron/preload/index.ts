import { ipcRenderer } from "electron";
import "../../renderer.d.ts";
import { LogLine } from "../main/serverProcess";

window.electronAPI = {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    // 関数だけでなく変数も公開できます
  },
  sp: {
    getLogs: () => ipcRenderer.invoke("spGetLogs"),
    onLogAppend: (callback: (event, data: LogLine) => void) =>
      ipcRenderer.on("spLogAppend", callback),
    offLogAppend: (callback: (event, data: LogLine) => void) =>
      ipcRenderer.off("spLogAppend", callback),
  },
};
