import { GamepadState } from "../libs/gamepad";
import { Card } from "./card";
import { Input } from "./input";
import { Switch } from "./switch";

interface Props {
  gamepadState: GamepadState;
}
export function GamepadCard(props: Props) {
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
      </div>
    </Card>
  );
}
