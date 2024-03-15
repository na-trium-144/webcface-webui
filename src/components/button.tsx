import { viewColor } from "webcface";
import { ReactNode } from "react";
import { bgButtonColorClass, textColorClass } from "../libs/color";
import { Caption } from "./caption";

interface Props {
  rounded?: "md" | "full";
  bgColor?: number;
  textColor?: number;
  onClick: () => void | Promise<void>;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  caption?: ReactNode;
}
export function Button(props: Props) {
  return (
    <div className={
      "inline-block relative " +
      (props.className !== undefined ? props.className : "")
    }>
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
        onClick={() => void props.onClick()}
        disabled={props.disabled}
      >
        {props.children}
      </button>
      {props.caption && <Caption>{props.caption}</Caption>}
    </div>
  );
}

interface IconProps{
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  children?: ReactNode;
  caption?: ReactNode;
  className?: string;
}
export function IconButton(props: IconProps) {
  return (
    <div className={
      "inline-block relative " +
      (props.className !== undefined ? props.className : "")
    }>
      <button
        className={
          "peer p-1 mx-0.5 " +
          (props.disabled
            ? "bg-neutral-300 shadow-none "
            : "hover:bg-green-50 active:bg-green-100 " +
              "hover:shadow-md active:shadow-none ") +
          "rounded-full "
        }
        onClick={() => void props.onClick()}
        disabled={props.disabled}
      >
        {props.children}
      </button>
      {props.caption && <Caption>{props.caption}</Caption>}
    </div>
  );
}
