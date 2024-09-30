import {
  useContext,
  createContext,
  useRef,
  ReactElement,
  useCallback,
} from "react";
import { LogLine } from "webcface";

export class LogDataWithLevels {
  data: Map<number, LogLine[]>; // data[n] は レベルn以上のログを保持する
  constructor() {
    this.data = new Map<number, LogLine[]>();
  }
  concat(logs: LogLine[]) {
    for (const ll of logs) {
      this.push(ll);
    }
  }
  push(ll: LogLine) {
    if (!this.data.has(ll.level)) {
      const nextLv = Math.min(
        ...[...this.data.keys()].filter((lv) => lv >= ll.level)
      );
      this.data.set(ll.level, this.data.get(nextLv)?.slice() || []);
    }
    for (const [lv, ls] of this.data) {
      if (lv <= ll.level) {
        ls.push(ll);
        if (ls.length > 1000) {
          ls.shift();
        }
      }
    }
  }
  get(level: number) {
    // コピーで返す
    const nextLv = Math.min(
      ...[...this.data.keys()].filter((lv) => lv >= level)
    );
    return this.data.get(nextLv)?.slice() || [];
  }
  get length() {
    const minLv = Math.min(...[...this.data.keys()]);
    return this.data.get(minLv)?.length || 0;
  }
}
export interface LogStoreData {
  serverData: { current: LogDataWithLevels }; // serverdata.current[n] はレベルn以上のすべてのログを1000行保持
  resetServerData: () => void;
  serverHasUpdate: { current: boolean };
  data: {
    current: { member: string; field: string; log: LogDataWithLevels }[];
  };
  getDataRef: (
    member: string,
    field: string
  ) => { member: string; field: string; log: LogDataWithLevels };
}
const LogStoreContext = createContext<LogStoreData>({
  serverData: { current: new LogDataWithLevels() },
  resetServerData: () => undefined,
  serverHasUpdate: { current: false },
  data: { current: [] },
  getDataRef: (member: string, field: string) => ({
    member,
    field,
    log: new LogDataWithLevels(),
  }),
});
export const useLogStore = () => useContext(LogStoreContext);

export function LogStoreProvider(props: { children: ReactElement }) {
  const serverData = useRef<LogDataWithLevels>(new LogDataWithLevels());
  const serverHasUpdate = useRef<boolean>(false);
  const data = useRef<
    { member: string; field: string; log: LogDataWithLevels }[]
  >([]);
  const getDataRef = useCallback((member: string, field: string) => {
    const id = data.current.findIndex(
      (ld) => ld.member === member && ld.field === field
    );
    if (id >= 0) {
      return data.current[id];
    } else {
      data.current.push({ member, field, log: new LogDataWithLevels() });
      return data.current[data.current.length - 1];
    }
  }, []);
  const resetServerData = useCallback(() => {
    serverData.current = new LogDataWithLevels();
  }, []);
  return (
    <LogStoreContext.Provider
      value={{
        serverData,
        resetServerData,
        serverHasUpdate,
        data,
        getDataRef,
      }}
    >
      {props.children}
    </LogStoreContext.Provider>
  );
}
