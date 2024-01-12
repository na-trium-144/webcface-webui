export interface LauncherCommand {
  name: string;
  exec: string;
  workdir: string;
}
export interface ServerConfig {
  launcher: {
    enabled: boolean;
    command: LauncherCommand[];
  };
}
