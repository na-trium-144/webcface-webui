export interface IElectronAPI {
  versions: {
    node: () => string;
    chrome: () => string;
    electron: () => string;
  };
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}
