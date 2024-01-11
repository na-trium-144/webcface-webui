import toml from "@iarna/toml";
import { ServerConfig } from "../config";
import { join } from "path";
import { readFileSync, writeFile } from "fs";

function defaultConfig() {
  return {
    launcher: {
      command: [],
    },
  } as ServerConfig;
}
function configPath() {
  if (process.env.APPDATA !== undefined) {
    return join(process.env.APPDATA, "webcface", "sg.toml");
  } else {
    return join(process.env.HOME, ".webcface.sg.toml");
  }
}
export function readConfigSync(): ServerConfig {
  try {
    const configStr = readFileSync(configPath(), "utf8");
    return toml.parse(configStr) as ServerConfig;
  } catch (e) {
    console.error(`Error reading config file: ${String(e)}`);
    return defaultConfig();
  }
}
export function writeConfig(config: ServerConfig) {
  writeFile(configPath(), toml.stringify(config), (e) => {
    if (e != null) {
      console.error(`Error writing config file: ${String(e)}`);
    }
  });
}
