import {
  useContext,
  createContext,
  useState,
  useEffect,
  useRef,
  ReactElement,
} from "react";
import { LayoutItem } from "react-grid-layout-next";

const lsKey = "webcface-webui";
const layoutsKey = "webcface-webui-layouts";
export interface LocalStorageData {
  layout: LayoutItem[];
  openedCards: string[];
  pinnedFuncs: [string, string][];
  valueCardWithPlot: [string, string][];
  gamepad: { [key: string]: { enabled: boolean; clientName: string } };
  browserId: string;
}

export interface LayoutConfig {
  layout: LayoutItem[];
  openedCards: string[];
  pinnedFuncs: [string, string][];
  valueCardWithPlot: [string, string][];
  gamepad: { [key: string]: { enabled: boolean; clientName: string } };
}

export interface LayoutsMap {
  [name: string]: LayoutConfig;
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
  // Multiple layouts management properties
  currentLayoutName: string;
  layoutNames: string[];
  switchLayout: (name: string) => void;
  addLayout: (name: string, config?: LayoutConfig) => void;
  deleteLayout: (name: string) => void;
  renameLayout: (oldName: string, newName: string) => void;
  exportSingleLayout: (name: string) => string;
  importSingleLayout: (name: string, jsonStr: string) => boolean;
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
  currentLayoutName: "Default",
  layoutNames: ["Default"],
  switchLayout: () => undefined,
  addLayout: () => undefined,
  deleteLayout: () => undefined,
  renameLayout: () => undefined,
  exportSingleLayout: () => "{}",
  importSingleLayout: () => false,
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

const browserIdKey = "webcface-webui-browser-id";

function isConfigEqual(a: LayoutConfig, b: LayoutConfig) {
  if (JSON.stringify(a.layout) !== JSON.stringify(b.layout)) return false;
  if (JSON.stringify(a.openedCards) !== JSON.stringify(b.openedCards)) return false;
  if (JSON.stringify(a.pinnedFuncs) !== JSON.stringify(b.pinnedFuncs)) return false;
  if (JSON.stringify(a.valueCardWithPlot) !== JSON.stringify(b.valueCardWithPlot)) return false;
  
  const keysA = Object.keys(a.gamepad || {});
  const keysB = Object.keys(b.gamepad || {});
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!b.gamepad[k]) return false;
    if (
      a.gamepad[k].enabled !== b.gamepad[k].enabled ||
      a.gamepad[k].clientName !== b.gamepad[k].clientName
    ) {
      return false;
    }
  }
  return true;
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

  // Multiple layouts management states
  const [currentLayoutName, setCurrentLayoutName] = useState<string>("Default");
  const [layoutsMap, setLayoutsMap] = useState<LayoutsMap>({});

  useEffect(() => {
    let initialLayoutName = "Default";

    let map: LayoutsMap = {};
    if (global !== undefined && global.localStorage) {
      const savedLayouts = global.localStorage.getItem(layoutsKey);
      if (savedLayouts) {
        try {
          map = JSON.parse(savedLayouts) as LayoutsMap;
        } catch (e) {
          console.error("Failed to parse saved layouts", e);
        }
      }
    }

    const legacyLs = getLS();

    // Migrate from legacy single layout to multi layouts mapping if empty
    if (Object.keys(map).length === 0) {
      map["Default"] = {
        layout: legacyLs.layout,
        openedCards: legacyLs.openedCards,
        pinnedFuncs: legacyLs.pinnedFuncs || [],
        valueCardWithPlot: legacyLs.valueCardWithPlot || [],
        gamepad: legacyLs.gamepad || {},
      };
      if (global !== undefined && global.localStorage) {
        global.localStorage.setItem(layoutsKey, JSON.stringify(map));
      }
    }

    if (!map[initialLayoutName]) {
      const keys = Object.keys(map);
      if (keys.length > 0) {
        initialLayoutName = keys[0];
      } else {
        initialLayoutName = "Default";
        map["Default"] = {
          layout: [],
          openedCards: [],
          pinnedFuncs: [],
          valueCardWithPlot: [],
          gamepad: {},
        };
      }
    }

    const currentConfig = map[initialLayoutName];
    setLayout(currentConfig.layout || []);
    setOpenedCards(currentConfig.openedCards || []);
    setPinnedFuncs(currentConfig.pinnedFuncs || []);
    setValueCardWithPlot(currentConfig.valueCardWithPlot || []);
    setGamepad(currentConfig.gamepad || {});

    let bId = "";
    if (global !== undefined && global.localStorage) {
      const savedBrowserId = global.localStorage.getItem(browserIdKey);
      if (savedBrowserId) {
        bId = savedBrowserId;
      } else {
        bId = legacyLs.browserId || Math.floor(Math.random() * 0x10000).toString(16);
        global.localStorage.setItem(browserIdKey, bId);
      }
    } else {
      bId = legacyLs.browserId || Math.floor(Math.random() * 0x10000).toString(16);
    }
    setBrowserId(bId);

    setCurrentLayoutName(initialLayoutName);
    setLayoutsMap(map);
    setInit(true);
  }, []);

  const applyLayoutConfig = (config: LayoutConfig) => {
    setLayout(config.layout || []);
    setOpenedCards(config.openedCards || []);
    setPinnedFuncs(config.pinnedFuncs || []);
    setValueCardWithPlot(config.valueCardWithPlot || []);
    setGamepad(config.gamepad || {});
  };

  const stateRef = useRef({
    layout,
    openedCards,
    pinnedFuncs,
    valueCardWithPlot,
    gamepad,
    currentLayoutName,
    init,
  });
  stateRef.current = {
    layout,
    openedCards,
    pinnedFuncs,
    valueCardWithPlot,
    gamepad,
    currentLayoutName,
    init,
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === layoutsKey && e.newValue) {
        try {
          const newMap = JSON.parse(e.newValue) as LayoutsMap;
          if (!stateRef.current.init) return;

          setLayoutsMap(newMap);

          const curName = stateRef.current.currentLayoutName;
          let nextLayoutName = curName;

          if (!newMap[curName]) {
            const remainingNames = Object.keys(newMap);
            if (remainingNames.length > 0) {
              nextLayoutName = remainingNames[0];
            } else {
              nextLayoutName = "Default";
              newMap["Default"] = {
                layout: [],
                openedCards: [],
                pinnedFuncs: [],
                valueCardWithPlot: [],
                gamepad: {},
              };
            }
            setCurrentLayoutName(nextLayoutName);
          }

          const nextConfig = newMap[nextLayoutName];
          if (nextConfig) {
            const currentConfig: LayoutConfig = {
              layout: stateRef.current.layout,
              openedCards: stateRef.current.openedCards,
              pinnedFuncs: stateRef.current.pinnedFuncs,
              valueCardWithPlot: stateRef.current.valueCardWithPlot,
              gamepad: stateRef.current.gamepad,
            };
            if (!isConfigEqual(currentConfig, nextConfig)) {
              applyLayoutConfig(nextConfig);
            }
          }
        } catch (err) {
          console.error("Failed to parse layouts from storage event", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (init) {
      const currentConfig: LayoutConfig = {
        layout,
        openedCards,
        pinnedFuncs,
        valueCardWithPlot,
        gamepad,
      };

      setLayoutsMap((prevMap) => {
        const newMap = {
          ...prevMap,
          [currentLayoutName]: currentConfig,
        };
        if (global !== undefined && global.localStorage) {
          const newMapStr = JSON.stringify(newMap);
          const stored = global.localStorage.getItem(layoutsKey);
          if (stored !== newMapStr) {
            global.localStorage.setItem(layoutsKey, newMapStr);
          }
        }
        return newMap;
      });

    }
  }, [
    layout,
    openedCards,
    pinnedFuncs,
    valueCardWithPlot,
    gamepad,
    browserId,
    currentLayoutName,
    init,
  ]);

  const switchLayout = (name: string) => {
    if (!init) return;

    const config = layoutsMap[name];
    if (config) {
      setCurrentLayoutName(name);
      applyLayoutConfig(config);
    }
  };

  const addLayout = (name: string, config?: LayoutConfig) => {
    if (!init || !name.trim()) return;

    if (layoutsMap[name]) {
      return;
    }

    const newConfig = config || {
      layout: [],
      openedCards: [],
      pinnedFuncs: [],
      valueCardWithPlot: [],
      gamepad: {},
    };

    setLayoutsMap((prevMap) => {
      const newMap = {
        ...prevMap,
        [name]: newConfig,
      };
      if (global !== undefined && global.localStorage) {
        global.localStorage.setItem(layoutsKey, JSON.stringify(newMap));
      }
      return newMap;
    });

    setCurrentLayoutName(name);
    applyLayoutConfig(newConfig);
  };

  const deleteLayout = (name: string) => {
    if (!init) return;

    if (!layoutsMap[name]) return;

    const newMap = { ...layoutsMap };
    delete newMap[name];

    if (Object.keys(newMap).length === 0) {
      newMap["Default"] = {
        layout: [],
        openedCards: [],
        pinnedFuncs: [],
        valueCardWithPlot: [],
        gamepad: {},
      };
    }

    setLayoutsMap(newMap);
    if (global !== undefined && global.localStorage) {
      global.localStorage.setItem(layoutsKey, JSON.stringify(newMap));
    }

    if (currentLayoutName === name) {
      const remainingNames = Object.keys(newMap);
      const nextLayoutName = remainingNames[0];
      const nextConfig = newMap[nextLayoutName];

      setCurrentLayoutName(nextLayoutName);
      applyLayoutConfig(nextConfig);
    }
  };

  const renameLayout = (oldName: string, newName: string) => {
    if (!init || !newName.trim() || oldName === newName) return;

    if (!layoutsMap[oldName] || layoutsMap[newName]) return;

    const newMap = { ...layoutsMap };
    newMap[newName] = newMap[oldName];
    delete newMap[oldName];

    setLayoutsMap(newMap);
    if (global !== undefined && global.localStorage) {
      global.localStorage.setItem(layoutsKey, JSON.stringify(newMap));
    }

    if (currentLayoutName === oldName) {
      setCurrentLayoutName(newName);
    }
  };

  const exportSingleLayout = (name: string): string => {
    const config = layoutsMap[name];
    return config ? JSON.stringify(config, null, 2) : "{}";
  };

  const importSingleLayout = (name: string, jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as LayoutConfig;
      if (typeof parsed !== "object" || parsed === null) return false;
      if (parsed.layout && !Array.isArray(parsed.layout)) return false;
      if (parsed.openedCards && !Array.isArray(parsed.openedCards)) return false;

      addLayout(name, {
        layout: parsed.layout || [],
        openedCards: parsed.openedCards || [],
        pinnedFuncs: parsed.pinnedFuncs || [],
        valueCardWithPlot: parsed.valueCardWithPlot || [],
        gamepad: parsed.gamepad || {},
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

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
        currentLayoutName,
        layoutNames: Object.keys(layoutsMap),
        switchLayout,
        addLayout,
        deleteLayout,
        renameLayout,
        exportSingleLayout,
        importSingleLayout,
      }}
    >
      {props.children}
    </LocalStorageContext.Provider>
  );
}
