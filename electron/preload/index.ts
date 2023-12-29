// import { contextBridge } from "electron";
import { Versions } from "@/libs/serverVersions";

window.serverAccess = true;
window.versions ={
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // 関数だけでなく変数も公開できます
} as Versions;
