import toml from "@iarna/toml";
import { ServerConfig } from "../config";
import { join } from "path";
import { readFileSync, writeFile } from "fs";

export function defaultConfig(): ServerConfig {
  return {
    launcher: {
      enabled: false,
      command: [],
    },
  };
}
function configPath() {
  if (process.env.APPDATA !== undefined) {
    return join(process.env.APPDATA, "webcface", "sg.toml");
  } else {
    return join(process.env.HOME, ".webcface.sg.toml");
  }
}
export function readConfigSync(path?: string): ServerConfig {
  const configStr = readFileSync(path || configPath(), "utf8");
  return toml.parse(configStr) as ServerConfig;
}
export function writeConfig(config: ServerConfig, path?: string) {
  writeFile(path || configPath(), toml.stringify(config), (e) => {
    if (e != null) {
      console.error(`Error writing config file: ${String(e)}`);
    }
  });
}
