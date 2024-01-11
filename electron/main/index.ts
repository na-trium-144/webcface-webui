import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
// import { release } from "node:os";
import { join, dirname } from "node:path";
// import { update } from './update'
import { ServerProcess, Process } from "./serverProcess";
import { LauncherCommand, ServerConfig } from "../config";
import { writeConfig, readConfigSync } from "./configIO";
import toml from "@iarna/toml";

process.env.DIST_ELECTRON = join(__dirname, "../");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;

const sp = new ServerProcess();
const launcher = new Process();
const config = readConfigSync();

function startLauncher(newCommands?: LauncherCommand[]) {
  if(newCommands !== undefined){
    config.launcher.command = newCommands;
    writeConfig(config);
  }
  if (launcher.running) {
    launcher.kill();
  }
  launcher.start(["webcface-launcher", "-s"]);
  launcher.write(toml.stringify(config.launcher));
  launcher.writeEnd();
}

// Disable GPU Acceleration for Windows 7
// if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  console.error(
    "Error: app.requestSingleInstanceLock failed. (another webcface-server-gui process is running?)"
  );
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (url) {
    // electron-vite-vue#298
    void win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    void win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  // win.webContents.on("did-finish-load", () => {
  //   win?.webContents.send("main-process-message", new Date().toLocaleString());
  // });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    // if (url.startsWith("https:")) {
    void shell.openExternal(url);
    // }
    return { action: "deny" };
  });

  // Apply electron-updater
  // update(win)
}

void app.whenReady().then(() => {
  sp.onLogAppend((data: string) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("spLogAppend", data);
    }
  });
  sp.start();
  startLauncher();
  ipcMain.handle("spGetLogs", () => sp.logs);
  ipcMain.handle("spGetUrl", () => sp.url);
  ipcMain.handle("spGetRunning", () => sp.running);
  ipcMain.on("spRestart", () => sp.start());
  ipcMain.handle("openExecDialog", async (_event, path: string) => {
    const dialogResult = await dialog.showOpenDialog(win, {
      title: "Open Executable",
      defaultPath: path || undefined,
      properties: ["openFile"],
    });
    return dialogResult.filePaths[0] || "";
  });
  ipcMain.handle("openWorkdirDialog", async (_event, path: string) => {
    const dialogResult = await dialog.showOpenDialog(win, {
      title: "Open Working Directory",
      defaultPath: path || undefined,
      properties: ["openDirectory"],
    });
    return dialogResult.filePaths[0] || "";
  });
  ipcMain.handle("dirname", (_event, path: string) => dirname(path));
  ipcMain.on("launcherSetCommands", (_event, commands: LauncherCommand[]) =>
    startLauncher(commands)
  );
  ipcMain.handle("launcherGetCommands", () => config.launcher.command || []);
  createWindow();
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") {
    sp.disconnect();
    app.quit();
  }
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});