import { useState, useEffect } from "react";
import { Client, LogLine } from "webcface";
import "./index.css";
import { LayoutMain } from "./components/layout";
import { Header } from "./components/header";
import { SideMenu } from "./components/sideMenu";
import { FuncResultList } from "./components/funcResultList";
import { LogDataWithLevels, useLogStore } from "./components/logStoreProvider";

export default function App() {
  const logStore = useLogStore();
  const [client, setClient] = useState<Client | null>(null);
  const [clientHost, setClientHost] = useState<string>("");
  const [clientPort, setClientPort] = useState<number | null>(null);
  const clientAddress = clientPort
    ? `(${clientHost}:${clientPort})`
    : `(${clientHost})`;
  const title = window.electronAPI ? "WebCFace Desktop" : "WebCFace";
  const [serverHostName, setServerHostName] = useState<string>("");

  useEffect(() => {
    // 7530ポートに接続するクライアント
    const clientDefault = new Client(
      "",
      window.location.hostname || "localhost",
      7530
    );
    clientDefault.start();

    // locationからポートを取得するクライアント
    let clientLocation: Client | null = null;
    if (window.location.port && parseInt(window.location.port) !== 7530) {
      clientLocation = new Client(
        "",
        window.location.hostname || "localhost",
        parseInt(window.location.port)
      );
      clientLocation.start();
    }

    setClientHost(window.location.hostname || "localhost");

    // どちらか片方のクライアントが接続に成功したらもう片方を閉じる
    const checkConnection = () => {
      if (clientLocation?.connected) {
        setClient(clientLocation);
        setClientPort(parseInt(window.location.port));
        clientDefault.close();
      } else if (clientDefault.connected) {
        setClient(clientDefault);
        setClientPort(7530);
        clientLocation?.close();
      } else {
        setTimeout(checkConnection, 100);
      }
    };
    setTimeout(checkConnection, 100);

    return () => {
      clientDefault.close();
      clientLocation?.close();
    };
  }, []);

  useEffect(() => {
    let i: ReturnType<typeof setTimeout> | null = null;
    const updateTitle = () => {
      const title = window.electronAPI ? "WebCFace Desktop" : "WebCFace WebUI";
      if (client?.serverHostName && clientPort) {
        setServerHostName(client.serverHostName);
        document.title = `${client.serverHostName} (${clientHost}:${clientPort}) - ${title}`;
      } else if (clientPort) {
        document.title = `${clientHost}:${clientPort} - ${title}`;
      } else {
        document.title = `${clientHost} - ${title}`;
      }
      if (!client?.serverHostName) {
        i = setTimeout(updateTitle, 100);
      }
    };
    updateTitle();
    return () => {
      if (i !== null) {
        clearTimeout(i);
      }
    };
  }, [client, clientHost, clientPort]);

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
    <div className="absolute w-full min-w-min min-h-screen h-max bg-neutral-100 -z-50">
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
        />
      </nav>
      <main className="p-2">
        <LayoutMain client={client} />
      </main>
      <FuncResultList />
    </div>
  );
}
