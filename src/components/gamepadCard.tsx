import { useEffect, useState } from "react";
import { GamepadState } from "../libs/gamepad";
import { Card } from "./card";
import { Input } from "./input";
import { Switch } from "./switch";

interface Props {
  gamepadState: GamepadState;
}
export function GamepadCard(props: Props) {
  const [buttonState, setButtonState] = useState<number[]>([]);
  const [axisState, setAxisState] = useState<number[]>([]);
  useEffect(() => {
    const i = setInterval(() => {
      const gamepad = navigator.getGamepads()[props.gamepadState.index];
      if (gamepad) {
        setButtonState(
          gamepad.buttons.map((b) => Number(b.value || b.pressed || b.touched))
        );
        setAxisState(gamepad.axes.slice());
      }
    }, 50);
    return () => clearInterval(i);
  }, [props.gamepadState]);

  const bgColor = (a: number) =>
    a > 0
      ? /* bg-breen-300 */ `rgb(134 239 172 / ${a})`
      : /* bg-orange-300 */ `rgb(253 186 116 / ${-a})`;
  return (
    <Card title={props.gamepadState.id}>
      <div className="w-full h-full overflow-auto ">
        <div className="flex flex-row items-baseline">
          <Switch
            checked={props.gamepadState.enabled}
            onChange={(c) =>
              props.gamepadState.updateState(c, props.gamepadState.clientName)
            }
          />
          <span className="flex-none w-max mx-1 text-sm">
            送信するMember名:
          </span>
          <Input
            className="flex-1"
            widthClass="min-w-48 "
            type="string"
            value={props.gamepadState.clientName}
            setValue={(n) =>
              props.gamepadState.updateState(
                props.gamepadState.enabled,
                String(n)
              )
            }
          />
        </div>
        <div>
          <span className="text-sm mr-1">Name:</span>
          <span className="text-sm text-nowrap">{props.gamepadState.id}</span>
        </div>
        <div className="text-nowrap">
          <span className="text-sm mr-1">Buttons:</span>
          {buttonState.map((b, i) => (
            <div
              key={i}
              className={
                "text-center text-xs inline-block min-w-7 py-0.5 " +
                "border-gray-300 border-t border-l border-b " +
                (i == 0 ? "rounded-l " : "") +
                (i == buttonState.length - 1 ? "rounded-r border-r " : "")
              }
              style={{ background: bgColor(b) }}
            >
              <div className="text-xs text-gray-500 ">[{i}]</div>
            </div>
          ))}
        </div>
        <div className="flex flex-row items-center mt-1">
          <span className="text-sm mr-1">Axes:</span>
          {axisState.map((a, i) => (
            <div
              key={i}
              className={
                "text-center inline-block w-10 py-0.5 " +
                "border-gray-300 border-t border-l border-b " +
                (i == 0 ? "rounded-l " : "") +
                (i == axisState.length - 1 ? "rounded-r border-r " : "")
              }
              style={{
                background: bgColor(a),
              }}
            >
              <div className="text-xs text-gray-500 ">[{i}]</div>
              <div className="text-sm ">{a.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
