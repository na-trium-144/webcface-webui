import { Card } from "./card";
import "../../renderer.d.ts";
import { useState, useEffect } from "react";
// import { useForceUpdate } from "../libs/forceUpdate";
import { useLogStore } from "./logStoreProvider";
import { viewColor } from "webcface";
import { Button } from "./button";
import { Switch } from "./switch";
import { LogLine } from "../../electron/logLine";

interface StatusProps {
  isRunning: boolean | null;
  onRestart: () => void;
}
function RunStatus(props: StatusProps) {
  if (props.isRunning === true) {
    return <span className="pl-1 text-green-500">Running</span>;
  } else if (props.isRunning === false) {
    return (
      <>
        <span className="pl-1 text-red-500">Not Running</span>
        <Button
          className="ml-2 inline-block"
          bgColor={viewColor.yellow}
          onClick={props.onRestart}
        >
          Restart
        </Button>
      </>
    );
  } else {
    return <span />;
  }
}
export function AboutCard(/*props: Props*/) {
  // const update = useForceUpdate();
  const logStore = useLogStore();
  const [serverLoad, setServerLoad] = useState<number>(0);
  useEffect(() => {
    const update = () => setServerLoad((n) => n + 1);
    window.electronAPI?.onStateChange(update);
    return () => window.electronAPI?.offStateChange(update);
  }, []);

  const [running, setRunning] = useState<boolean | null>(null);
  const [url, setUrl] = useState<string[]>([]);

  const [launcherEnabled, setLauncherEnabled] = useState<boolean>(false);
  const [launcherRunning, setLauncherRunning] = useState<boolean | null>(null);
  const [launcherLogs, setLauncherLogs] = useState<LogLine[]>([]);
  const startStopLauncher = (checked: boolean) => {
    if (checked) {
      window.electronAPI?.launcher.enable();
      setLauncherLogs([]);
    } else {
      window.electronAPI?.launcher.disable();
      setLauncherRunning(null);
    }
    setLauncherEnabled(checked);
  };
  useEffect(() => {
    void window.electronAPI?.launcher
      .getEnabled()
      .then((e) => setLauncherEnabled(e));
  }, [serverLoad]);

  useEffect(() => {
    const update = () => {
      void window.electronAPI?.sp.getRunning().then((r) => setRunning(r));
      void window.electronAPI?.sp.getUrl().then((u) => setUrl(u));
      if (launcherEnabled) {
        void window.electronAPI?.launcher.getRunning().then((r) => {
          setLauncherRunning(r);
          if (!r) {
            void window.electronAPI?.launcher
              .getLogs()
              .then((l) => setLauncherLogs(l));
          }
        });
      }
    };
    update();
    const i = setInterval(update, 100);
    return () => clearInterval(i);
  }, [launcherEnabled]);

  return (
    <Card title={`Server Status`}>
      <div className="w-full h-full overflow-auto">
        <ul className="list-none w-max">
          <li className="flex items-baseline">
            <span className="text-sm">Server Status:</span>
            <RunStatus
              isRunning={running}
              onRestart={() => {
                logStore.serverData.current = [];
                window.electronAPI?.sp.restart();
              }}
            />
          </li>
          {!running &&
            logStore.serverData.current
              .filter((ll) => ll.level >= 5)
              .map((ll, i) => (
                <li className="pl-8 text-sm font-noto-mono" key={i}>
                  {ll.message}
                </li>
              ))}
          <li className="flex items-baseline">
            <span className="text-sm">WebUI URL:</span>
            <ul className="list-none">
              {url.map((u, i) => (
                <li key={i}>
                  <a
                    className="pl-1 underline text-blue-500"
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li className="flex items-baseline">
            <span className="text-sm">Launcher:</span>
            <span className="pl-1">
              <Switch checked={launcherEnabled} onChange={startStopLauncher} />
            </span>
            {launcherEnabled && (
              <RunStatus
                isRunning={launcherRunning}
                onRestart={() => {
                  startStopLauncher(true);
                }}
              />
            )}
          </li>
          {launcherEnabled &&
            !launcherRunning &&
            launcherLogs
              .filter((ll) => ll.level >= 5)
              .map((ll, i) => (
                <li className="pl-8 text-sm font-noto-mono" key={i}>
                  {ll.message}
                </li>
              ))}
        </ul>
      </div>
    </Card>
  );
}

/*
  <p className="text-sm flex items-center">
    <span className="">Node.js:</span>
    <span className="pl-1">{window.electronAPI?.versions.node()}</span>
  </p>
  <p className="text-sm flex items-center">
    <span className="">Chrome:</span>
    <span className="pl-1">
      {window.electronAPI?.versions.chrome()}
    </span>
  </p>
  <p className="text-sm flex items-center">
    <span className="">Electron:</span>
    <span className="pl-1">
      {window.electronAPI?.versions.electron()}
    </span>
  </p>
*/
