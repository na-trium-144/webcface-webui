import { Card } from "./card";
import { viewColor } from "webcface";
import { useEffect, useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Right, Down, Delete, Plus, CheckOne } from "@icon-park/react";
import { LauncherCommand } from "../../electron/config";
import "../../renderer.d.ts";

export function LauncherCard() {
  const [config, setConfig] = useState<LauncherCommand[]>([]);
  useEffect(() => {
    void window.electronAPI.launcher.getCommands().then((commands) => {
      setConfig(commands);
    });
  }, []);
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
              onDelete={() => setConfig(config.filter((oc, oi) => oi !== i))}
            />
          ))}
        </ul>
        <div className="mt-2 flex space-x-2">
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
            className="flex items-center space-x-1"
          >
            <Plus />
            <span>Add New Command</span>
          </Button>
          <Button
            className="flex items-center space-x-1"
            bgColor={viewColor.yellow}
            onClick={() => window.electronAPI.launcher.setCommands(config)}
          >
            <CheckOne />
            <span>Save & Restart</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface LineProps {
  config: LauncherCommand;
  setConfig: (c: LauncherCommand) => void;
  onDelete: () => void;
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
                    caption={
                      <>
                        <div>実行するコマンド</div>
                        <div>(引数なども設定可能)</div>
                      </>
                    }
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
                    caption={<div>実行するディレクトリ</div>}
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
          <div>
            <Button
              rounded="full"
              className="py-0.5 flex items-center space-x-1"
              bgColor={viewColor.red}
              onClick={props.onDelete}
            >
              <Delete />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}