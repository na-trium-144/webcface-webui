import { Card } from "./card";
import { viewColor } from "webcface";
import { useEffect, useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import {
  Right,
  Down,
  Delete,
  Plus,
  CheckOne,
  CloseSmall,
  ArrowUp,
  ArrowDown,
} from "@icon-park/react";
import { LauncherCommand } from "../../electron/config";
import isEqual from "lodash.isequal";
import "../../renderer.d.ts";

function swapArray<T>(array: T[], index1: number, index2: number): T[] {
  return array.map((c, i) => {
    switch (i) {
      case index1:
        return array[index2];
      case index2:
        return array[index1];
      default:
        return c;
    }
  });
}
export function LauncherCard() {
  const [serverLoad, setServerLoad] = useState<number>(0);
  useEffect(() => {
    const update = () => setServerLoad((n) => n + 1);
    window.electronAPI?.onStateChange(update);
    return () => window.electronAPI?.offStateChange(update);
  }, []);

  const [config, setConfig] = useState<LauncherCommand[]>([]);
  const [savedConfig, setSavedConfig] = useState<LauncherCommand[]>([]);
  const [launcherEnabled, setLauncherEnabled] = useState<boolean>(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  useEffect(() => {
    void window.electronAPI?.launcher.getCommands().then((commands) => {
      setSavedConfig((savedConfig) => {
        setConfig((config) => {
          if (isEqual(config, savedConfig)) {
            return commands;
          } else {
            return config;
          }
        });
        return commands;
      });
    });
    void window.electronAPI?.launcher
      .getEnabled()
      .then((e) => setLauncherEnabled(e));
  }, [serverLoad]);
  const saveCommands = () => {
    window.electronAPI?.launcher.setCommands(config);
    setSavedConfig(config);
  };
  return (
    <Card title={`Launcher Settings`}>
      <div className="h-full overflow-y-auto">
        <ul className="list-decimal pl-8">
          {config.map((c, i) => (
            <LauncherConfigLine
              key={i}
              config={c}
              open={i === openIndex}
              setOpen={(open: boolean) => setOpenIndex(open ? i : null)}
              setConfig={(c: LauncherCommand) =>
                setConfig(config.map((oc, oi) => (oi === i ? c : oc)))
              }
              onDelete={() => setConfig(config.filter((_oc, oi) => oi !== i))}
              moveUp={
                i === 0
                  ? null
                  : () => {
                      setConfig(swapArray(config, i, i - 1));
                      setOpenIndex(i - 1);
                    }
              }
              moveDown={
                i === config.length - 1
                  ? null
                  : () => {
                      setConfig(swapArray(config, i, i + 1));
                      setOpenIndex(i + 1);
                    }
              }
            />
          ))}
        </ul>
        <div className="mt-2">
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
            className="mr-2"
            buttonClassName="flex items-center space-x-1 "
          >
            <Plus />
            <span>Add New Command</span>
          </Button>
          <Button
            className="mr-2"
            buttonClassName="flex items-center space-x-1 "
            bgColor={viewColor.orange}
            onClick={saveCommands}
            disabled={isEqual(config, savedConfig)}
          >
            <CheckOne />
            <span>{launcherEnabled ? "Save & Restart" : "Save"}</span>
          </Button>
          <Button
            className="mr-2"
            buttonClassName="flex items-center space-x-1 "
            bgColor={viewColor.red}
            onClick={() => setConfig(savedConfig)}
            disabled={isEqual(config, savedConfig)}
          >
            <CloseSmall />
            <span>Cancel</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface LineProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  config: LauncherCommand;
  setConfig: (c: LauncherCommand) => void;
  onDelete: () => void;
  moveUp: null | (() => void);
  moveDown: null | (() => void);
}
export function LauncherConfigLine(props: LineProps) {
  return (
    <li>
      <div className="flex items-center speces-x-1">
        <Input
          type="string"
          value={props.config.name}
          setValue={(name: string | number | boolean) =>
            props.setConfig({ ...props.config, name: String(name) })
          }
          widthClass="w-40 "
        />
        <button
          className="hover:text-green-700"
          onClick={() => {
            props.setOpen(!props.open);
          }}
        >
          {props.open ? <Down className="pt-0.5" /> : <Right />}
        </button>
      </div>
      {props.open && (
        <div className="">
          <table>
            <tbody>
              <tr>
                <td>Exec:</td>
                <td className="w-full">
                  <Input
                    type="string"
                    value={props.config.exec}
                    setValue={(exec: string | number | boolean) =>
                      props.setConfig({ ...props.config, exec: String(exec) })
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
                        (await window.electronAPI?.dirname(props.config.exec))
                      ) {
                        workdir = "";
                      }
                      const exec =
                        (await window.electronAPI?.openExecDialog(
                          props.config.exec
                        )) || "";
                      if (exec !== "") {
                        if (workdir === "") {
                          workdir =
                            (await window.electronAPI?.dirname(exec)) || "";
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
                    setValue={(workdir: string | number | boolean) =>
                      props.setConfig({
                        ...props.config,
                        workdir: String(workdir),
                      })
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
                        (await window.electronAPI?.openWorkdirDialog(
                          props.config.workdir
                        )) || "";
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
          <div className="mt-1 mb-3 flex space-x-2 items-stretch">
            <Button
              rounded="full"
              buttonClassName="flex items-center space-x-1 h-full"
              bgColor={viewColor.red}
              onClick={props.onDelete}
            >
              <Delete />
              <span>Delete</span>
            </Button>
            <Button
              rounded="full"
              buttonClassName="flex items-center space-x-1 h-full"
              onClick={props.moveUp || (() => undefined)}
              disabled={!props.moveUp}
            >
              <ArrowUp />
            </Button>
            <Button
              rounded="full"
              buttonClassName="flex items-center space-x-1 h-full"
              onClick={props.moveDown || (() => undefined)}
              disabled={!props.moveDown}
            >
              <ArrowDown />
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
