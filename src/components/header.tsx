// import { useState, useEffect } from "react";
// import version from "../libs/version";
import { HamburgerButton, CloseSmall } from "@icon-park/react";

interface Props {
  menuOpen: boolean;
  setMenuOpen: (menuOpen: boolean) => void;
}
export function Header(props: Props) {
  return (
    <div className="flex h-full items-center space-x-4">
      <div className="flex-1 flex items-baseline space-x-2">
        <h1 className="text-2xl">WebCFace</h1>
        {/*<span>ver.{version}</span>*/}
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
