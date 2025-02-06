import { useEffect, useRef, useState } from "react";
import { Client } from "webcface";
import { useLocalStorage } from "../components/lsProvider";

export interface GamepadState {
  id: string;
  connected: boolean;
  enabled: boolean;
  clientName: string;
  index: number;
  updateState: (enabled: boolean, clientName: string) => void;
}

export function useGamepad(clientHost: string, clientPort: number | null) {
  const ls = useLocalStorage();
  const [gamepadState, setGamepadState] = useState<GamepadState[]>([]);
  const gamepadSender = useRef<(Client | null)[]>([]);

  useEffect(() => {
    for (let i = 0; i < gamepadState.length; i++) {
      if (
        gamepadState[i].connected &&
        gamepadState[i].enabled &&
        (!gamepadSender.current[i] ||
          gamepadSender.current[i]!.name !== gamepadState[i].clientName) &&
        gamepadState[i].clientName &&
        clientPort
      ) {
        gamepadSender.current[i]?.close();
        gamepadSender.current[i] = new Client(
          gamepadState[i].clientName,
          clientHost,
          clientPort
        );
        gamepadSender.current[i]!.start();
      } else if (
        (!gamepadState[i].connected || !gamepadState[i].enabled) &&
        gamepadSender.current[i]
      ) {
        gamepadSender.current[i]!.close();
        gamepadSender.current[i] = null;
      }
    }

    let f: number | null = null;
    const sendGamepads = () => {
      const gamepads = navigator.getGamepads();
      if (gamepads) {
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i] && gamepadSender.current[i]) {
            gamepadSender.current[i]!.text("name").set(gamepads[i]!.id);
            gamepadSender.current[i]!.value("buttons").set(
              gamepads[i]!.buttons.map((b) =>
                Number(b.value || b.pressed || b.touched)
              )
            );
            gamepadSender.current[i]!.value("axes").set(gamepads[i]!.axes);
            gamepadSender.current[i]!.sync();
          }
        }
        f = requestAnimationFrame(sendGamepads);
      }
    };
    sendGamepads();

    const updateGamepadNum = () => {
      const gamepads = navigator.getGamepads();
      while (gamepadState.length < gamepads.length) {
        const i = gamepadState.length;
        gamepadState.push({
          id: "",
          connected: false,
          enabled: false,
          clientName: `webui-joystick-${ls.browserId}-${i}`,
          index: i,
          updateState: (e: boolean, cn: string) => {
            const gamepad = navigator.getGamepads()[i];
            if (gamepad) {
              ls.updateGamepad(gamepad.id, e, cn);
              setGamepadState((s) => {
                s[i].enabled = e;
                s[i].clientName = cn;
                return s.slice();
              });
            }
          },
        });
      }
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          gamepadState[i].connected = true;
          gamepadState[i].id = gamepads[i]!.id;
          if (ls.gamepad[gamepads[i]!.id]) {
            gamepadState[i].enabled = ls.gamepad[gamepads[i]!.id].enabled;
            gamepadState[i].clientName = ls.gamepad[gamepads[i]!.id].clientName;
          }
        } else {
          gamepadState[i].connected = false;
        }
      }
      setGamepadState(gamepadState.slice());
      while (gamepadSender.current.length < gamepads.length) {
        gamepadSender.current.push(null);
      }
    };
    window.addEventListener("gamepadconnected", updateGamepadNum);
    window.addEventListener("gamepaddisconnected", updateGamepadNum);
    return () => {
      if (f !== null) {
        cancelAnimationFrame(f);
      }
      window.removeEventListener("gamepadconnected", updateGamepadNum);
      window.removeEventListener("gamepaddisconnected", updateGamepadNum);
    };
  }, [gamepadState, clientHost, clientPort, ls]);

  return gamepadState;
}
