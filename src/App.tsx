import { useState, useEffect, useRef } from "react";
import { Client } from "webcface";
import "./index.css";
import { LayoutMain } from "./components/layout";
import { Header } from "./components/header";
import { SideMenu } from "./components/sideMenu";
import { FuncResultList } from "./components/funcResultList";

export default function App() {
  const client = useRef<Client | null>(null);
  const clientDefault = useRef<Client | null>(null); // 7530ポートに接続するクライアント
  const clientLocation = useRef<Client | null>(null); // locationからポートを取得するクライアント
  useEffect(() => {
    clientDefault.current = new Client("", window.location.hostname, 7530);
    if (parseInt(window.location.port) !== 7530) {
      clientLocation.current = new Client(
        "",
        window.location.hostname,
        parseInt(window.location.port)
      );
    }

    // どちらか片方のクライアントが接続に成功したらもう片方を閉じる
    const checkConnection = () => {
      if (clientLocation.current?.connected) {
        client.current = clientLocation.current;
        clientDefault.current?.close();
      } else if (clientDefault.current?.connected) {
        client.current = clientDefault.current;
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
      client.current?.sync();
    }, 100);
    return () => clearInterval(i);
  }, [client]);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [openedCards, setOpenedCards] = useState<string[]>([]);
  const isOpened = (key: string) => openedCards.includes(key);
  const openedOrder = (key: string) => openedCards.indexOf(key) || 0;
  const toggleOpened = (key: string) => {
    if (openedCards.includes(key)) {
      setOpenedCards(openedCards.filter((n) => n !== key));
    } else {
      setOpenedCards(openedCards.concat([key]));
    }
  };
  const moveOrder = (key: string) => {
    setOpenedCards(openedCards.filter((n) => n !== key).concat([key]));
  };

  console.log("app update");
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
        <SideMenu
          client={client}
          isOpened={isOpened}
          toggleOpened={toggleOpened}
        />
      </nav>
      <main className="p-2">
        <LayoutMain
          client={client}
          isOpened={isOpened}
          openedOrder={openedOrder}
          moveOrder={moveOrder}
        />
      </main>
      <FuncResultList />
    </div>
  );
}
