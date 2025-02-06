import { useState, useEffect, useRef } from "react";
import { Client, LogLine } from "webcface";
import "./index.css";
import { LayoutMain } from "./components/layout";
import { Header } from "./components/header";
import { SideMenu } from "./components/sideMenu";
import { FuncResultList } from "./components/funcResultList";
import { LogDataWithLevels, useLogStore } from "./components/logStoreProvider";
import { useGamepad } from "./libs/gamepad";
import { useWebCFace } from "./libs/webcface";

export default function App() {
  const logStore = useLogStore();
  const title = window.electronAPI ? "WebCFace Desktop" : "WebCFace";
  const {
    client,
    clientHost,
    clientPort,
    clientAddress,
    serverHostName,
    windowTitle,
  } = useWebCFace();
  const gamepadState = useGamepad(clientHost, clientPort);

  useEffect(() => {
    document.title = windowTitle;
  }, [windowTitle]);

  useEffect(() => {
    if (window.electronAPI) {
      const onLogAppend = (_event: object, data: LogLine) => {
        logStore.serverData.current.push(data);
        logStore.serverHasUpdate.current = true;
      };
      window.electronAPI.sp.onLogAppend(onLogAppend);
      void (async () => {
        if (window.electronAPI) {
          const logs = await window.electronAPI.sp.getLogs();
          logStore.serverData.current = new LogDataWithLevels();
          logStore.serverData.current.concat(logs);
          logStore.serverHasUpdate.current = true;
        }
      })();
      return () => {
        window.electronAPI?.sp.offLogAppend(onLogAppend);
      };
    }
  }, [logStore.serverData, logStore.serverHasUpdate]);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className="absolute w-full min-w-min min-h-dvh h-max bg-neutral-100 -z-50">
      <nav className="bg-green-300 w-full min-w-min h-12 px-2 drop-shadow-lg">
        <div className="min-w-[288px] h-full">
          <Header
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            clientAddress={clientAddress}
            title={title}
            serverHostName={serverHostName}
          />
        </div>
      </nav>
      <nav
        className={
          "absolute top-10 right-2 w-72 h-max max-h-[75%] p-2 " +
          "rounded-lg shadow-lg overflow-x-hidden overflow-y-auto bg-white " +
          "transition duration-100 origin-top-right " +
          (menuOpen
            ? "ease-out opacity-100 scale-100 z-[1000] "
            : "ease-in opacity-0 scale-90 -z-10 ")
        }
      >
        <SideMenu
          client={client}
          clientAddress={clientAddress}
          serverHostName={serverHostName}
          gamepadState={gamepadState}
        />
      </nav>
      <main className="p-2">
        <LayoutMain client={client} gamepadState={gamepadState} />
      </main>
      <FuncResultList />
    </div>
  );
}
