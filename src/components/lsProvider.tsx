import {
  useContext,
  createContext,
  useState,
  useEffect,
  ReactElement,
} from "react";
import { LayoutItem } from "react-grid-layout-next";

const lsKey = "webcface-webui";
export interface LocalStorageData {
  layout: LayoutItem[];
  openedCards: string[];
  pinnedFuncs: [string, string][];
  valueCardWithPlot: [string, string][];
  gamepad: { [key: string]: { enabled: boolean; clientName: string } };
  browserId: string;
}
export type LocalStorage = LocalStorageData & {
  init: boolean;
  setLayout: (
    layout: LayoutItem[] | ((layout: LayoutItem[]) => LayoutItem[])
  ) => void;
  isOpened: (key: string) => boolean;
  toggleOpened: (key: string) => void;
  pinFunc: (m: string, f: string) => void;
  unPinFunc: (m: string, f: string) => void;
  enableValueCardWithPlot: (m: string, f: string) => void;
  disableValueCardWithPlot: (m: string, f: string) => void;
  updateGamepad: (n: string, e: boolean, cn: string) => void;
};

const LocalStorageContext = createContext<LocalStorage>({
  layout: [],
  openedCards: [],
  pinnedFuncs: [],
  valueCardWithPlot: [],
  gamepad: {},
  browserId: "",
  init: false,
  setLayout: () => undefined,
  isOpened: () => false,
  toggleOpened: () => undefined,
  pinFunc: () => undefined,
  unPinFunc: () => undefined,
  enableValueCardWithPlot: () => undefined,
  disableValueCardWithPlot: () => undefined,
  updateGamepad: () => undefined,
});
export const useLocalStorage = () => useContext(LocalStorageContext);

function getLS() {
  const emptyLs: LocalStorageData = {
    layout: [],
    openedCards: [],
    pinnedFuncs: [],
    valueCardWithPlot: [],
    gamepad: {},
    browserId: "",
  };
  if (global != undefined && global.localStorage) {
    const lsItem = global.localStorage.getItem(lsKey);
    if (lsItem) {
      const ls1 = JSON.parse(lsItem) as LocalStorageData;
      if (
        typeof ls1 === "object" &&
        ls1 &&
        ls1.layout &&
        Array.isArray(ls1.layout) &&
        ls1.openedCards &&
        Array.isArray(ls1.openedCards)
      ) {
        return ls1;
      }
    }
  }
  return emptyLs;
}

function saveToLS(ls: LocalStorageData) {
  if (global != undefined && global.localStorage) {
    global.localStorage.setItem(lsKey, JSON.stringify(ls));
  }
}

export function LocalStorageProvider(props: { children: ReactElement }) {
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [openedCards, setOpenedCards] = useState<string[]>([]);
  const [pinnedFuncs, setPinnedFuncs] = useState<[string, string][]>([]);
  const [valueCardWithPlot, setValueCardWithPlot] = useState<
    [string, string][]
  >([]);
  const [gamepad, setGamepad] = useState<{
    [key: string]: { enabled: boolean; clientName: string };
  }>({});
  const [browserId, setBrowserId] = useState<string>("");
  const [init, setInit] = useState<boolean>(false);
  useEffect(() => {
    const ls = getLS();
    setLayout(ls.layout);
    setOpenedCards(ls.openedCards);
    setPinnedFuncs(ls.pinnedFuncs || []);
    setValueCardWithPlot(ls.valueCardWithPlot || []);
    setGamepad(ls.gamepad || {});
    setBrowserId(
      ls.browserId || Math.floor(Math.random() * 0x10000).toString(16)
    );
    setInit(true);
  }, []);
  useEffect(() => {
    if (init) {
      saveToLS({
        layout,
        openedCards,
        pinnedFuncs,
        valueCardWithPlot,
        gamepad,
        browserId,
      });
    }
  }, [
    layout,
    openedCards,
    pinnedFuncs,
    init,
    valueCardWithPlot,
    gamepad,
    browserId,
  ]);

  return (
    <LocalStorageContext.Provider
      value={{
        init,
        layout,
        setLayout,
        openedCards,
        valueCardWithPlot,
        gamepad,
        browserId,
        isOpened: (key: string) => openedCards.includes(key),
        toggleOpened: (key: string) => {
          if (openedCards.includes(key)) {
            setOpenedCards(openedCards.filter((n) => n !== key));
            // カードを閉じるときzをリセットする(-1にする)
            setLayout(layout.map((l) => (l.i === key ? { ...l, z: -1 } : l)));
          } else {
            setOpenedCards(openedCards.concat([key]));
          }
        },
        pinnedFuncs,
        pinFunc: (m: string, f: string) =>
          setPinnedFuncs(
            pinnedFuncs.some((p) => p[0] === m && p[1] === f)
              ? pinnedFuncs
              : pinnedFuncs.concat([[m, f]])
          ),
        unPinFunc: (m: string, f: string) =>
          setPinnedFuncs(
            pinnedFuncs.filter((pf) => pf[0] !== m || pf[1] !== f)
          ),
        enableValueCardWithPlot: (m: string, f: string) =>
          setValueCardWithPlot(
            valueCardWithPlot.some((p) => p[0] === m && p[1] === f)
              ? valueCardWithPlot
              : valueCardWithPlot.concat([[m, f]])
          ),
        disableValueCardWithPlot: (m: string, f: string) =>
          setValueCardWithPlot(
            valueCardWithPlot.filter((pf) => pf[0] !== m || pf[1] !== f)
          ),
        updateGamepad: (n: string, e: boolean, cn: string) => {
          gamepad[n] = { enabled: e, clientName: cn };
          setGamepad({ ...gamepad });
        },
      }}
    >
      {props.children}
    </LocalStorageContext.Provider>
  );
}
