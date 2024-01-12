import { Card } from "./card";
import { Member, LogLine } from "webcface";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useLogStore } from "./logStoreProvider";

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
  const logsRaw = useRef<LogLine[]>([]);
  const hasUpdate = useRef<boolean>(false);
  const maxLine = 1000;
  useEffect(() => {
    const update = () => {
      logsRaw.current = logsRaw.current
        .concat(props.member.log().get())
        .slice(-maxLine);
      props.member.log().clear();
      logStore.setData(props.member.name, logsRaw.current);
      hasUpdate.current = true;
    };
    update();
    props.member.log().on(update);
    return () => {
      props.member.log().off(update);
    };
  }, [props.member]);
  useEffect(() => {
    logsRaw.current =
      logStore.data.current.find((ld) => ld.name === props.member.name)?.log ||
      [];
    // onScroll();
    hasUpdate.current = true;
  }, [props.member, logStore]);

  return (
    <LogCardImpl
      logsRaw={logsRaw}
      hasUpdate={hasUpdate}
      name={props.member.name}
    />
  );
}
export function LogCardServer() {
  const logStore = useLogStore();
  return (
    <LogCardImpl
      logsRaw={logStore.serverData}
      hasUpdate={logStore.serverHasUpdate}
      name={"webcface server"}
    />
  );
}


interface Props2 {
  logsRaw: { current: LogLine[] };
  hasUpdate: { current: boolean };
  name: string;
}
function LogCardImpl(props: Props2) {
  const { logsRaw, hasUpdate, name } = props;
  const [logLine, setLogLine] = useState<number>(0);
  const [logsCurrent, setLogsCurrent] = useState<LogLine[]>([]);
  const [visibleLogBegin, setVisibleLogBegin] = useState<number>(0);
  const [visibleLogEnd, setVisibleLogEnd] = useState<number>(0);
  const logsDiv = useRef<HTMLDivElement>(null);
  const [minLevel, setMinLevel] = useState<number>(2);
  const [followRealTime, setFollowRealTime] = useState<boolean>(true);
  const followRealTimeRef = useRef<boolean>(true);

  const lineHeight = 24;
  const onScroll = () => {
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
        followRealTimeRef.current = false;
      }
    }
  };
  const followLog = (f: boolean) => {
    if (logsDiv.current !== null && f) {
      logsDiv.current.scrollTo(0, lineHeight * logsCurrent.length);
    }
    setFollowRealTime(f);
    followRealTimeRef.current = f;
  };
  useEffect(() => {
    if (logsDiv.current !== null) {
      const observer = new ResizeObserver(onScroll);
      observer.observe(logsDiv.current);
      return () => observer.disconnect();
    }
  }, [followRealTime]);

  useEffect(() => {
    const updateLogsCurrent = () => {
      setLogLine(logsRaw.current.length);
      const logsCurrent = logsRaw.current.filter((l) => l.level >= minLevel);
      setLogsCurrent(logsCurrent);
      setTimeout(() => {
        if (logsDiv.current !== null && followRealTimeRef.current) {
          logsDiv.current.scrollTo(0, lineHeight * logsCurrent.length);
        }
      });
      hasUpdate.current = false;
    };
    const i = setInterval(() => {
      if (hasUpdate.current) {
        updateLogsCurrent();
      }
    }, 50);
    updateLogsCurrent();
    return () => clearInterval(i);
  }, [setLogLine, setLogsCurrent, minLevel]);

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
          以上のログを表示: 全<span className="px-1">{logLine}</span>
          行中
          <span className="px-1">{logsCurrent.length}</span>行
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
                    <td className="px-1 font-mono w-full">{l.message}</td>
                  </tr>
                ))}
              <tr className="text-transparent select-none">
                <td className="px-1 text-center">0:00:00.000</td>
                <td className="px-1.5 text-center">5(Critical)</td>
                <td className="px-1 font-mono w-full"></td>
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
