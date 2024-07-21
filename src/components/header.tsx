import { useEffect } from "react";
// import version from "../libs/version";
import { HamburgerButton, CloseSmall } from "@icon-park/react";
import "../../renderer.d.ts";
import { Client } from "webcface";

interface Props {
  menuOpen: boolean;
  setMenuOpen: (menuOpen: boolean) => void;
  client: Client | null;
  clientHost: string;
  clientPort: number | null;
}
export function Header(props: Props) {
  const title = window.electronAPI ? "WebCFace Desktop" : "WebCFace";
  useEffect(() => {
    let i: ReturnType<typeof setTimeout> | null = null;
    const updateTitle = () => {
      const title = window.electronAPI ? "WebCFace Desktop" : "WebCFace WebUI";
      if (props.client?.serverHostName && props.clientPort) {
        document.title = `${props.client?.serverHostName} (${props.clientHost}:${props.clientPort}) - ${title}`;
      } else if (props.clientPort) {
        document.title = `${props.clientHost}:${props.clientPort} - ${title}`;
      } else {
        document.title = `${props.clientHost} - ${title}`;
      }
      if (!props.client?.serverHostName) {
        i = setTimeout(updateTitle, 100);
      }
    };
    updateTitle();
    return () => {
      if (i !== null) {
        clearTimeout(i);
      }
    };
  }, [props.client, props.clientHost, props.clientPort]);
  return (
    <div className="flex h-full items-center space-x-2">
      <img className="h-5/6" src="icon.svg" />
      <div className="flex-1 flex items-baseline">
        <h1 className="text-2xl">{title}</h1>
      </div>
      <button
        className={
          "flex-none flex space-x-2 items-center " +
          "rounded-md px-2 py-1 hover:bg-green-400 active:bg-green-500 "
        }
        onClick={() => props.setMenuOpen(!props.menuOpen)}
      >
        <span>Menu</span>
        {props.menuOpen ? <CloseSmall /> : <HamburgerButton />}{" "}
      </button>
    </div>
  );
}
