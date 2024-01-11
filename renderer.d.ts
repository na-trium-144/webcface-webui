interface LogLine {
  level: number;
  time: Date;
  message: string;
}
export interface IElectronAPI {
  versions: {
    node: () => string;
    chrome: () => string;
    electron: () => string;
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
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
