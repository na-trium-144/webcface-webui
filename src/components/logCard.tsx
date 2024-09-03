import { Card } from "./card";
import { Member, LogLine, Log } from "webcface";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { LogDataWithLevels, useLogStore } from "./logStoreProvider";
import { useLayoutChange } from "./layoutChangeProvider";

interface Props {
  member: Member;
}
const levelNames = ["Trace", "Debug", "Info", "Warn", "Error", "Critical"];
const levelColors = [
  "text-inherit ",
  "text-cyan-600 ",
  "text-green-600 ",
  "text-amber-600 ",
  "text-red-600 ",
  "text-white bg-red-600 ",
];
export function LogCard(props: Props) {
  const logStore = useLogStore();
  const logsRef = useRef<LogDataWithLevels>(new LogDataWithLevels()); // 内容はlogStoreと同期される
  const fetchLog = useCallback(() => {
    const newLogs = props.member.log().get();
    if (newLogs.length > 0) {
      logStore.getDataRef(props.member.name).log.concat(newLogs);
      logsRef.current = logStore.getDataRef(props.member.name).log;
      props.member.log().clear();
      return true;
    }
    return false;
  }, [props.member, logStore]);

  return (
    <LogCardImpl
      logsRef={logsRef}
      fetchLog={fetchLog}
      name={props.member.name}
    />
  );
}
export function LogCardServer() {
  const logStore = useLogStore();
  return (
    <LogCardImpl
      logsRef={logStore.serverData}
      fetchLog={() => logStore.serverHasUpdate.current}
      name={"webcface server"}
    />
  );
}

interface Props2 {
  logsRef: { current: LogDataWithLevels };
  fetchLog: () => boolean; // logをチェックしてlogsRefに反映し、更新されていたらtrueを返す
  name: string;
}
const lineHeight = 24;
function LogCardImpl(props: Props2) {
  const { layoutChanging } = useLayoutChange();
  const { logsRef, fetchLog, name } = props;
  // 引数のlogsRefは高頻度で更新されるが、以下のstateは50msに1回更新される
  // const [logLine, setLogLine] = useState<number>(0);
  const [logsCurrent, setLogsCurrent] = useState<LogLine[]>([]);
  const [visibleLogBegin, setVisibleLogBegin] = useState<number>(0);
  const [visibleLogEnd, setVisibleLogEnd] = useState<number>(0);
  const logsDiv = useRef<HTMLDivElement>(null);
  const [minLevel, setMinLevel] = useState<number>(2);
  const [followRealTime, setFollowRealTime] = useState<boolean>(true);

  const onScroll = useCallback(() => {
    if (logsDiv.current !== null) {
      const newBegin = Math.floor(logsDiv.current.scrollTop / lineHeight);
      const newEnd =
        Math.ceil(
          (logsDiv.current.scrollTop + logsDiv.current.clientHeight) /
            lineHeight
        ) + 1;
      setVisibleLogBegin(newBegin);
      setVisibleLogEnd(newEnd);
      if (newEnd < logsCurrent.length) {
        setFollowRealTime(false);
      }
    }
  }, [logsCurrent]);
  const followLog = (f: boolean) => {
    if (logsDiv.current !== null && f) {
      logsDiv.current.scrollTo(0, lineHeight * logsCurrent.length);
    }
    setFollowRealTime(f);
  };
  useEffect(() => {
    if (logsDiv.current !== null) {
      const observer = new ResizeObserver(onScroll);
      observer.observe(logsDiv.current);
      return () => observer.disconnect();
    }
  }, [onScroll]);

  useEffect(() => {
    if (!layoutChanging) {
      const updateLogsCurrent = () => {
        // setLogLine(logsRef.current.length);
        const logsCurrent = logsRef.current.get(minLevel);
        setLogsCurrent(logsCurrent);
        setTimeout(() => {
          if (logsDiv.current !== null) {
            logsDiv.current.scrollTo(0, lineHeight * logsCurrent.length);
          }
        });
        // hasUpdate.current = false;
      };
      updateLogsCurrent();
      const i = setInterval(() => {
        if (followRealTime) {
          if (fetchLog()) {
            updateLogsCurrent();
          }
        }
      }, 50);
      return () => clearInterval(i);
    }
  }, [layoutChanging, minLevel, fetchLog, logsRef, followRealTime]);

  return (
    <Card title={`${name} Logs`}>
      <div className="flex flex-col w-full h-full">
        <div className="flex-none pl-2 pb-1">
          レベル
          <input
            className={
              "border-0 border-b outline-0 mx-1 w-12 text-center " +
              "border-neutral-200 hover:border-neutral-500 focus:border-black "
            }
            type="number"
            value={minLevel}
            onChange={(e) => {
              setMinLevel(parseInt(e.target.value));
            }}
          />
          以上のログを表示
          {/*全<span className="px-1">{logLine}</span>
          行中
          <span className="px-1">{logsCurrent.length}</span>行*/}
        </div>
        <div className="flex-1 overflow-auto" ref={logsDiv} onScroll={onScroll}>
          <table
            className="block table-auto min-w-full w-max text-sm overflow-y-hidden"
            style={{ height: lineHeight * (logsCurrent.length + 1) }}
          >
            {/*<thead>
              <tr className="border-b" style={{height: lineHeight}}>
                <th className="font-medium">Time</th>
                <th className="font-medium">Level</th>
                <th className="font-medium">Message</th>
              </tr>
            </thead>*/}
            <tbody>
              <tr style={{ height: lineHeight * visibleLogBegin }}>
                <td />
              </tr>
              {logsCurrent
                .slice(visibleLogBegin, visibleLogEnd)
                .map((l, li) => (
                  <tr
                    key={li + visibleLogBegin}
                    className="border-b"
                    style={{ height: lineHeight }}
                  >
                    <td className="text-center">
                      {format(l.time, "H:mm:ss.SSS")}
                    </td>
                    <td className="text-center">
                      <span
                        className={
                          "px-0.5 rounded-sm " + (levelColors[l.level] || "")
                        }
                      >
                        {l.level}
                        {levelNames[l.level] !== ""
                          ? `(${levelNames[l.level]})`
                          : ""}
                      </span>
                    </td>
                    <td className="px-1 font-noto-mono w-full">{l.message}</td>
                  </tr>
                ))}
              <tr className="text-transparent select-none">
                <td className="px-1 text-center">0:00:00.000</td>
                <td className="px-1.5 text-center">5(Critical)</td>
                <td className="px-1 font-noto-mono w-full"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex-none flex items-center px-2 space-x-1 text-sm">
          <input
            type="checkbox"
            id={`follow-${name}-log`}
            checked={followRealTime}
            onChange={(e) => followLog(e.target.checked)}
          />
          <label htmlFor={`follow-${name}-log`}>Follow Latest Data</label>
        </div>
      </div>
    </Card>
  );
}
