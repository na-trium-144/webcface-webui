import { ipcRenderer } from "electron";
import "../../renderer.d.ts";
import { LogLine } from "../logLine";
import { LauncherCommand } from "../config";

window.electronAPI = {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    // 関数だけでなく変数も公開できます
  },
  onLoad: (callback: () => void) => ipcRenderer.on("load", callback),
  offLoad: (callback: () => void) => ipcRenderer.off("load", callback),
  config: {
    import: () => ipcRenderer.send("configImport"),
    export: () => ipcRenderer.send("configExport"),
  },
  sp: {
    getLogs: () => ipcRenderer.invoke("spGetLogs"),
    getUrl: () => ipcRenderer.invoke("spGetUrl"),
    getRunning: () => ipcRenderer.invoke("spGetRunning"),
    onLogAppend: (callback: (event: object, data: LogLine) => void) =>
      ipcRenderer.on("spLogAppend", callback),
    offLogAppend: (callback: (event: object, data: LogLine) => void) =>
      ipcRenderer.off("spLogAppend", callback),
    restart: () => ipcRenderer.send("spRestart"),
  },
  openExecDialog: (path: string) => ipcRenderer.invoke("openExecDialog", path),
  openWorkdirDialog: (path: string) =>
    ipcRenderer.invoke("openWorkdirDialog", path),
  dirname: (path: string) => ipcRenderer.invoke("dirname", path),
  launcher: {
    setCommands: (commands: LauncherCommand[]) =>
      ipcRenderer.send("launcherSetCommands", commands),
    getCommands: () => ipcRenderer.invoke("launcherGetCommands"),
    enable: () => ipcRenderer.send("launcherEnable"),
    disable: () => ipcRenderer.send("launcherDisable"),
    getRunning: () => ipcRenderer.invoke("launcherGetRunning"),
    getEnabled: () => ipcRenderer.invoke("launcherGetEnabled"),
    getLogs: () => ipcRenderer.invoke("launcherGetLogs"),
  },
};
