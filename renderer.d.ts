import { LogLine } from "./electron/logLine";
import { ServerConfig, LauncherCommand } from "./electron/config";

export interface IElectronAPI {
  versions: {
    node: () => string;
    chrome: () => string;
    electron: () => string;
  };
  onLoad: (callback: () => void) => void;
  offLoad: (callback: () => void) => void;
  config: {
    import: () => void;
    export: () => void;
  };
  sp: {
    getLogs: () => Promise<LogLine[]>;
    getUrl: () => Promise<string>;
    getRunning: () => Promise<boolean>;
    onLogAppend: (callback: (event, data: LogLine) => void) => void;
    offLogAppend: (callback: (event, data: LogLine) => void) => void;
    restart: () => void;
  };
  openExecDialog: (path: string) => Promise<string>;
  openWorkdirDialog: (path: string) => Promise<string>;
  dirname: (path: string) => Promise<string>;
  launcher: {
    setCommands: (commands: LauncherCommand[]) => void;
    getCommands: () => Promise<LauncherCommand[]>;
    enable: () => void;
    disable: () => void;
    getLogs: () => Promise<LogLine[]>;
    getEnabled: () => Promise<boolean>;
    getRunning: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
