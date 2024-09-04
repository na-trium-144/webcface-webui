// import version from "../libs/version";
import { HamburgerButton, CloseSmall } from "@icon-park/react";
import "../../renderer.d.ts";

interface Props {
  menuOpen: boolean;
  setMenuOpen: (menuOpen: boolean) => void;
  clientAddress: string;
  title: string;
  serverHostName: string;
}
export function Header(props: Props) {
  return (
    <div className="flex h-full items-center space-x-2">
      <img className="h-5/6" src="icon.svg" />
      <div className="flex-1 flex items-baseline space-x-2">
        <h1 className="text-2xl">{props.title}</h1>
        {props.serverHostName && (
          <p className="hidden sm:inline-block">{props.serverHostName}</p>
        )}
        <p className="hidden sm:inline-block">{props.clientAddress}</p>
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
