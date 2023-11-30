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
}
export type LocalStorage = LocalStorageData & {
  init: boolean;
  setLayout: (
    layout: LayoutItem[] | ((layout: LayoutItem[]) => LayoutItem[])
  ) => void;
  isOpened: (key: string) => boolean;
  toggleOpened: (key: string) => void;
};

const LocalStorageContext = createContext<LocalStorage>({
  layout: [],
  openedCards: [],
  init: false,
  setLayout: () => undefined,
  isOpened: () => false,
  toggleOpened: () => undefined,
});
export const useLocalStorage = () => useContext(LocalStorageContext);

function getLS() {
  const emptyLs: LocalStorageData = {
    layout: [],
    openedCards: [],
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
  const [init, setInit] = useState<boolean>(false);
  useEffect(() => {
    const ls = getLS();
    setLayout(ls.layout);
    setOpenedCards(ls.openedCards);
    setInit(true);
  }, []);
  useEffect(() => {
    if (init) {
      saveToLS({ layout, openedCards });
    }
  }, [layout, openedCards, init]);

  return (
    <LocalStorageContext.Provider
      value={{
        init,
        layout,
        setLayout,
        openedCards,
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
      }}
    >
      {props.children}
    </LocalStorageContext.Provider>
  );
}
