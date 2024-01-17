import { useState, useEffect, useRef } from "react";
import { Client, LogLine } from "webcface";
import "./index.css";
import { LayoutMain } from "./components/layout";
import { Header } from "./components/header";
import { SideMenu } from "./components/sideMenu";
import { FuncResultList } from "./components/funcResultList";
import { useLogStore } from "./components/logStoreProvider";

export default function App() {
  const logStore = useLogStore();
  const [client, setClient] = useState<Client | null>(null);
  const clientDefault = useRef<Client | null>(null); // 7530ポートに接続するクライアント
  const clientLocation = useRef<Client | null>(null); // locationからポートを取得するクライアント
  useEffect(() => {
    clientDefault.current = new Client(
      "",
      "10.100.25.172",
      7530
    );
    clientDefault.current.start();
    if (window.location.port && parseInt(window.location.port) !== 7530) {
      clientLocation.current = new Client(
        "",
        window.location.hostname || "localhost",
        parseInt(window.location.port)
      );
      clientLocation.current.start();
    }

    // どちらか片方のクライアントが接続に成功したらもう片方を閉じる
    const checkConnection = () => {
      if (clientLocation.current?.connected) {
        setClient(clientLocation.current);
        clientDefault.current?.close();
      } else if (clientDefault.current?.connected) {
        setClient(clientDefault.current);
        clientLocation.current?.close();
      } else {
        setTimeout(checkConnection, 100);
      }
    };
    setTimeout(checkConnection, 100);

    return () => {
      clientDefault.current?.close();
      clientLocation.current?.close();
    };
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      client?.pingStatus;
      client?.sync();
    }, 100);
    return () => clearInterval(i);
  }, [client]);

  useEffect(() => {
    if (window.electronAPI) {
      const maxLine = 1000;
      const onLogAppend = (_event: object, data: LogLine) => {
        logStore.serverData.current = logStore.serverData.current
          .concat([data])
          .slice(-maxLine);
        logStore.serverHasUpdate.current = true;
      };
      window.electronAPI.sp.onLogAppend(onLogAppend);
      void (async () => {
        if (window.electronAPI) {
          logStore.serverData.current = (
            await window.electronAPI.sp.getLogs()
          ).slice(-maxLine);
          logStore.serverHasUpdate.current = true;
        }
      })();
      return () => {
        window.electronAPI?.sp.offLogAppend(onLogAppend);
      };
    }
  }, []);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className="absolute w-full min-w-min min-h-screen h-max bg-neutral-100 -z-50">
      <nav className="bg-green-300 w-full min-w-min h-12 px-2 drop-shadow-lg">
        <div className="min-w-[288px] h-full">
          <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
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
        <SideMenu client={client} />
      </nav>
      <main className="p-2">
        <LayoutMain client={client} />
      </main>
      <FuncResultList />
    </div>
  );
}
