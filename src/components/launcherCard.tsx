import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Member, Text } from "webcface";
import { useEffect, useRef, useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Right, Down } from "@icon-park/react";
import "../../renderer.d.ts";

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
                <td className="w-full">
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
                <td>
                  <Button
                    onClick={async () => {
                      let workdir = props.config.workdir;
                      if (
                        workdir ===
                        (await window.electronAPI.dirname(props.config.exec))
                      ) {
                        workdir = "";
                      }
                      const exec = await window.electronAPI.openExecDialog(
                        props.config.exec
                      );
                      if (exec !== "") {
                        if (workdir === "") {
                          workdir = await window.electronAPI.dirname(exec);
                        }
                        props.setConfig({ ...props.config, exec, workdir });
                      }
                    }}
                  >
                    ...
                  </Button>
                </td>
              </tr>
              <tr>
                <td>WorkDir:</td>
                <td>
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
                <td>
                  <Button
                    onClick={async () => {
                      const workdir =
                        await window.electronAPI.openWorkdirDialog(
                          props.config.workdir
                        );
                      if (workdir !== "") {
                        props.setConfig({ ...props.config, workdir });
                      }
                    }}
                  >
                    ...
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </li>
  );
}
