import { Card } from "./card";
import "../../renderer.d.ts";
import { useState, useEffect } from "react";
// import { useForceUpdate } from "../libs/forceUpdate";
import { useLogStore } from "./logStoreProvider";
import { buttonColorClass } from "./viewCard";
import { viewColor } from "webcface";

export function AboutCard(/*props: Props*/) {
  // const update = useForceUpdate();
  const logStore = useLogStore();
  const [running, setRunning] = useState<boolean>(false);
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    const update = () => {
      void window.electronAPI?.sp.getRunning().then((r) => setRunning(r));
      void window.electronAPI?.sp.getUrl().then((u) => setUrl(u));
    };
    update();
    const i = setInterval(update, 100);
    return () => clearInterval(i);
  }, []);
  return (
    <Card title={`Server Status`}>
      <div className="w-full h-full overflow-auto">
        <div className="w-max">
          <p className="flex items-baseline">
            <span className="text-sm">Server Status:</span>
            {running ? (
              <span className="pl-1 text-green-500">Running</span>
            ) : (
              <>
                <span className="pl-1 text-red-500">Not Running</span>
                <button
                  className={
                    "ml-2 rounded-md border px-2 shadow-md active:shadow-none " +
                    buttonColorClass[viewColor.yellow][0] +
                    buttonColorClass[viewColor.black][1]
                  }
                  onClick={() => {
                    logStore.serverData.current = [];
                    window.electronAPI?.sp.restart();
                  }}
                >
                  Restart
                </button>
              </>
            )}
          </p>
          {!running &&
            logStore.serverData.current
              .filter((ll) => ll.level >= 5)
              .map((ll, i) => (
                <p className="pl-8 text-sm font-mono" key={i}>
                  {ll.message}
                </p>
              ))}
          <p className="flex items-baseline">
            <span className="text-sm">WebUI URL:</span>
            {url !== "" && (
              <a className="pl-1 underline text-blue-500" href={url} target="_blank">
                {url}
              </a>
            )}
          </p>
        </div>
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
