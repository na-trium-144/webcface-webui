import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { rmSync } from "node:fs";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import pkg from "./package.json";
import { spawnSync } from "node:child_process";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  let webuiVersion = pkg.version;
  if (!process.env.WEBUI_NO_SUFFIX) {
    webuiVersion = String(spawnSync("git", ["describe", "--tags"]).stdout).slice(1);
  }

  if (!!process.env.ELECTRON) {
    rmSync("dist-electron", { recursive: true, force: true });

    const isServe = command === "serve";
    const isBuild = command === "build";
    const sourcemap = isServe;

    return {
      define: {
        "process.env.webuiVersion": JSON.stringify(webuiVersion),
      },
      plugins: [
        react(),
        electron([
          {
            // Main-Process entry file of the Electron App.
            entry: "electron/main/index.ts",
            onstart(options) {
              if (process.env.VSCODE_DEBUG) {
                console.log(
                  /* For `.vscode/.debug.script.mjs` */ "[startup] Electron App"
                );
              } else {
                options.startup();
              }
            },
            vite: {
              build: {
                sourcemap,
                minify: isBuild,
                outDir: "dist-electron/main",
                rollupOptions: {
                  external: Object.keys(
                    "dependencies" in pkg ? pkg.dependencies : {}
                  ),
                },
              },
            },
          },
          {
            entry: "electron/preload/index.ts",
            onstart(options) {
              // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
              // instead of restarting the entire Electron App.
              options.reload();
            },
            vite: {
              build: {
                sourcemap: sourcemap ? "inline" : undefined, // #332
                minify: isBuild,
                outDir: "dist-electron/preload",
                rollupOptions: {
                  external: Object.keys(
                    "dependencies" in pkg ? pkg.dependencies : {}
                  ),
                },
              },
            },
          },
        ]),
        // Use Node.js API in the Renderer-process
        renderer(),
      ],
      clearScreen: false,
    };
  } else {
    return {
      plugins: [react()],
      define: {
        global: "window",
        "process.env": {},
        "process.env.webuiVersion": JSON.stringify(webuiVersion),
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              three: ["three"],
              fiber: ["@react-three/fiber"],
              math: ["mathjs"],
              webcface: ["webcface"],
            },
          },
        },
      },
    };
  }
});
