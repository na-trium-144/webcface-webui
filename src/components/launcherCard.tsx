import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Member, Text } from "webcface";
import { useEffect, useRef, useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Right, Down } from "@icon-park/react";

interface LauncherCommand {
  name: string;
  exec: string;
  workdir: string;
}
interface Props {}
export function LauncherCard(props: Props) {
  const [config, setConfig] = useState<LauncherCommand[]>([]);

  return (
    <Card title={`Launcher Settings`}>
      <div className="h-full overflow-y-auto">
        <ul className="list-decimal pl-8">
          {config.map((c, i) => (
            <LauncherConfigLine
              key={i}
              config={c}
              setConfig={(c: LauncherCommand) =>
                setConfig(config.map((oc, oi) => (oi === i ? c : oc)))
              }
            />
          ))}
        </ul>
        <div>
          <Button
            onClick={() => {
              setConfig(
                config.concat([
                  {
                    name: `Command ${config.length + 1}`,
                    exec: "",
                    workdir: "",
                  },
                ])
              );
            }}
            className="mt-2 "
          >
            + Add New
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface LineProps {
  config: LauncherCommand;
  setConfig: (c: LauncherCommand) => void;
}
export function LauncherConfigLine(props: LineProps) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <li>
      <div className="flex items-center speces-x-1">
        <Input
          type="string"
          value={props.config.name}
          setValue={(name: string) =>
            props.setConfig({ ...props.config, name })
          }
          widthClass="w-40 "
        />
        <button
          className="hover:text-green-700"
          onClick={() => {
            setOpen(!open);
          }}
        >
          {open ? <Down className="pt-0.5" /> : <Right />}
        </button>
      </div>
      {open && (
        <div className="">
          <table>
            <tbody>
              <tr>
                <td>Exec:</td>
                <td  className="w-full">
                  <Input
                    type="string"
                    value={props.config.exec}
                    setValue={(exec: string) =>
                      props.setConfig({ ...props.config, exec })
                    }
                    className="w-full "
                    widthClass="w-full "
                  />
                </td>
              </tr>
              <tr>
                <td>WorkDir:</td>
                <td  className="w-full">
                  <Input
                    type="string"
                    value={props.config.workdir}
                    setValue={(workdir: string) =>
                      props.setConfig({ ...props.config, workdir })
                    }
                    className="w-full "
                    widthClass="w-full "
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}
