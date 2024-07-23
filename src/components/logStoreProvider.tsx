import { da } from "date-fns/locale";
import {
  useContext,
  createContext,
  useRef,
  ReactElement,
  useCallback,
} from "react";
import { LogLine } from "webcface";

export interface LogStoreData {
  serverData: { current: LogLine[] };
  serverHasUpdate: { current: boolean };
  data: { current: { name: string; log: LogLine[] }[] };
  getDataRef: (name: string) => { name: string; log: LogLine[] };
}
const LogStoreContext = createContext<LogStoreData>({
  serverData: { current: [] },
  serverHasUpdate: { current: false },
  data: { current: [] },
  getDataRef: (name: string) => ({ name, log: [] }),
});
export const useLogStore = () => useContext(LogStoreContext);

export function LogStoreProvider(props: { children: ReactElement }) {
  const serverData = useRef<LogLine[]>([]);
  const serverHasUpdate = useRef<boolean>(false);
  const data = useRef<{ name: string; log: LogLine[] }[]>([]);
  const getDataRef = useCallback((name: string) => {
    const id = data.current.findIndex((ld) => ld.name === name);
    if (id >= 0) {
      return data.current[id];
    } else {
      data.current.push({ name, log: [] });
      return data.current[data.current.length - 1];
    }
  }, []);
  return (
    <LogStoreContext.Provider
      value={{
        serverData,
        serverHasUpdate,
        data,
        getDataRef,
      }}
    >
      {props.children}
    </LogStoreContext.Provider>
  );
}
