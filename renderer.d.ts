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
    getLogs: () => LogLine[];
    onLogAppend: (callback: (event, data: LogLine) => void) => void;
    offLogAppend: (callback: (event, data: LogLine) => void) => void;
  };
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
