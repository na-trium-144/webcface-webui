export interface LauncherCommand {
  name: string;
  exec: string;
  workdir: string;
}
export interface ServerConfigLauncher {
  enabled: boolean;
  command: LauncherCommand[];
}
export interface ServerConfig {
  launcher: ServerConfigLauncher;
}
