import { viewColor } from "webcface";
import { ReactElement } from "react";
import { bgButtonColorClass, textColorClass } from "../libs/color";

interface Props {
  rounded?: "md" | "full";
  bgColor?: number;
  textColor?: number;
  onClick: () => void;
  children?: ReactElement;
  disabled?: boolean;
}
export function Button(props: Props) {
  return (
    <button
      className={
        "border px-2 " +
        textColorClass(props.textColor || viewColor.black) +
        (props.disabled
          ? "border-neutral-400 bg-neutral-300 shadow-none "
          : bgButtonColorClass(props.bgColor || viewColor.green) +
            "shadow-md active:shadow-none ") +
        (props.rounded === "full" ? "rounded-full " : "rounded-md ")
      }
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
}
