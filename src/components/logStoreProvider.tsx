import { useContext, createContext, useRef, ReactElement } from "react";
import { LogLine } from "webcface";

export interface LogStoreData {
  data: { current: { name: string; log: LogLine[] }[] };
  setData: (name: string, log: LogLine[]) => void;
}
const LogStoreContext = createContext<LogStoreData>({
  data: { current: [] },
  setData: () => undefined,
});
export const useLogStore = () => useContext(LogStoreContext);

export function LogStoreProvider(props: { children: ReactElement }) {
  const data = useRef<{ name: string; log: LogLine[] }[]>([]);
  return (
    <LogStoreContext.Provider
      value={{
        data,
        setData: (name: string, log: LogLine[]) => {
          const id = data.current.findIndex((ld) => ld.name === name);
          if (id >= 0) {
            data.current[id].log = log;
          } else {
            data.current.push({ name, log });
          }
        },
      }}
    >
      {props.children}
    </LogStoreContext.Provider>
  );
}
