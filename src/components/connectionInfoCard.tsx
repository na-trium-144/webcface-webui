import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Client, Member, version as webcfaceVersion } from "webcface";
import { useEffect } from "react";
import webuiVersion from "../libs/version";
import { Wifi, CloseWifi } from "@icon-park/react";

interface Props {
  client: { current: Client | null };
}
export function ConnectionInfoCard(props: Props) {
  const update = useForceUpdate();
  // console.log(props.client.current?.data.pingStatus);
  // console.log(props.client.current?.data.memberIds);
  useEffect(() => {
    const setListener = (m: Member) => {
      m.onPing.on(update);
    };
    if (props.client.current && props.client.current.members().length > 0) {
      setListener(props.client.current.members()[0]);
    } else {
      props.client.current?.onMemberEntry.once(setListener);
      return () => {
        props.client.current?.onMemberEntry.off(setListener);
      };
    }
  }, [props.client, update]);
  return (
    <Card title={`Connection Info`}>
      <div>
        <p style={{ marginBottom: -4 }}>
          <span className="text-sm">Server:</span>
          <span className="font-mono pl-2">
            {props.client.current?.serverName}
          </span>
          <span className="font-mono pl-2">
            {props.client.current?.serverVersion}
          </span>
        </p>
        <p style={{ marginBottom: -4 }}>
          <span className="text-sm">Client:</span>
          <span className="font-mono pl-2">{webcfaceVersion}</span>
        </p>
        <p style={{ marginBottom: -4 }}>
          <span className="text-sm">WebUI:</span>
          <span className="font-mono pl-2">{webuiVersion}</span>
        </p>
        <p style={{ marginBottom: -4 }}>
          <span className="text-sm">Members:</span>
        </p>
        <ul>
          {props.client.current?.members().map((m, i) => (
            <li key={i} className="pl-4 flex items-center">
              <span className="text-sm">{m.name}</span>
              <span className="text-xs pl-1">({m.remoteAddr})</span>
              <span className="text-xs font-mono pl-2">{m.libName}</span>
              <span className="text-xs font-mono pl-1.5">{m.libVersion}</span>
              <div className="pl-2">
                {m.pingStatus !== null ? (
                  <Wifi
                    fill={
                      m.pingStatus < 10
                        ? "green"
                        : m.pingStatus < 100
                        ? "yellow"
                        : "red"
                    }
                  />
                ) : (
                  <CloseWifi fill="red" />
                )}
              </div>
              <span className="text-sm pl-1">
                {m.pingStatus !== null ? m.pingStatus : "?"}
              </span>
              <span className="text-sm pl-1">ms</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
