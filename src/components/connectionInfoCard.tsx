import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Client, version as webcfaceVersion } from "webcface";
import { useEffect } from "react";
import webuiVersion from "../libs/version";
import { Wifi, CloseWifi } from "@icon-park/react";

interface WifiProps {
  level: 0 | 1 | 2 | 3;
}
function WifiStrength(props: WifiProps) {
  return props.level > 0 ? (
    <Wifi
      fill={props.level === 3 ? "green" : props.level === 2 ? "yellow" : "red"}
    />
  ) : (
    <CloseWifi fill="red" />
  );
}

interface Props {
  client: Client | null;
}
export function ConnectionInfoCard(props: Props) {
  const update = useForceUpdate();
  useEffect(() => {
    const i = setInterval(update, 100);
    return () => clearInterval(i);
  }, [update]);
  return (
    <Card title={`Connection Info`}>
      <div className="w-full h-full overflow-auto">
        <div className="w-max">
          <p className="text-sm flex items-center">
            <span className="">Server:</span>
            <span className="pl-1">{props.client?.serverName}</span>
            <span className="pl-1">{props.client?.serverVersion}</span>
            <span className="pl-2">
              <WifiStrength level={props.client?.connected ? 3 : 0} />
            </span>
          </p>
          <p className="text-sm">
            <span className="">WebUI:</span>
            <span className="pl-1">{webuiVersion}</span>
            <span className="text-xs pl-2">(</span>
            <span className="text-xs">Client:</span>
            <span className="text-xs pl-1">{webcfaceVersion}</span>
            <span className="text-xs">)</span>
          </p>
          <p className="text-sm">
            <span className="">Members:</span>
          </p>
          <ul>
            {props.client?.members().map((m, i) => (
              <li key={i} className="pl-4 text-sm flex items-center">
                <span className="">
                  {m.name}
                  {m.remoteAddr === "127.0.0.1" || (
                    <span className="text-xs pl-0.5">({m.remoteAddr})</span>
                  )}
                </span>
                <div className="pl-1">
                  <WifiStrength
                    level={
                      m.pingStatus === null
                        ? 0
                        : m.pingStatus < 10
                        ? 3
                        : m.pingStatus < 100
                        ? 2
                        : 1
                    }
                  />
                </div>
                <span className="pl-1">
                  {m.pingStatus !== null ? m.pingStatus : "?"}
                </span>
                <span className="pl-1">ms</span>
                <span className="pl-0.5">:</span>
                <span className="pl-1">{m.libName}</span>
                <span className="pl-1">{m.libVersion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
