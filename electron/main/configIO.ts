import toml from "@iarna/toml";
import { ServerConfig } from "../config";
import { join, dirname } from "path";
import { readFileSync, writeFile, mkdir } from "fs";

export function tomlStringify<T>(obj: T) {
  return toml.stringify(obj as unknown as toml.JsonMap);
}
export function tomlParse<T>(s: string): T {
  return toml.parse(s) as unknown as T;
}

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
    return join(process.env.HOME || ".", ".webcface.sg.toml");
  }
}
export function readConfigSync(path?: string): ServerConfig {
  const configStr = readFileSync(path || configPath(), "utf8");
  return tomlParse<ServerConfig>(configStr);
}
export function writeConfig(config: ServerConfig, path?: string) {
  mkdir(dirname(path || configPath()), { recursive: true }, () => {
    writeFile(
      path || configPath(),
      tomlStringify<ServerConfig>(config),
      (e: Error | null) => {
        if (e != null) {
          console.error(`Error writing config file: ${e}`);
        }
      }
    );
  });
}
