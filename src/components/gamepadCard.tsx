import { Card } from "./card";

export interface GamepadState {
  id: string;
  connected: boolean;
  enabled: boolean;
}

interface Props {
  gamepadState: GamepadState;
  index: number;
}
export function GamepadCard(props: Props) {
  return (
    <Card title={props.gamepadState.id}>
    </Card>
  );
}
