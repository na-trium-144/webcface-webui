import { useEffect, useState } from "react";
import { Client } from "webcface";

export function useWebCFace() {
  const [client, setClient] = useState<Client | null>(null);
  const [clientHost, setClientHost] = useState<string>("");
  const [clientPort, setClientPort] = useState<number | null>(null);
  const clientAddress = clientPort
    ? `(${clientHost}:${clientPort})`
    : `(${clientHost})`;
  const [serverHostName, setServerHostName] = useState<string>("");
  const windowTitleDefault = window.electronAPI
    ? "WebCFace Desktop"
    : "WebCFace WebUI";
  const [windowTitle, setWindowTitle] = useState<string>(windowTitleDefault);

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
      if (client?.serverHostName && clientPort) {
        setServerHostName(client.serverHostName);
        setWindowTitle(
          `${client.serverHostName} (${clientHost}:${clientPort}) - ${windowTitleDefault}`
        );
      } else if (clientPort) {
        setWindowTitle(`${clientHost}:${clientPort} - ${windowTitleDefault}`);
      } else {
        setWindowTitle(`${clientHost} - ${windowTitleDefault}`);
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
  }, [client, clientHost, clientPort, windowTitleDefault]);

  return {
    client,
    clientHost,
    clientPort,
    clientAddress,
    serverHostName,
    windowTitle,
  };
}
