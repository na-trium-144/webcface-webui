import { ReactNode } from "react";

interface Props {
  className?: string;
  children: ReactNode;
}
export function Caption(props: Props) {
  return (
    <CaptionBox
      className={
        "absolute top-full left-1/2 -translate-x-2/4 translate-y-2 " +
        "hidden peer-focus:inline-block peer-hover:inline-block " +
        (props.className || "")
      }
    >
      <span
        className={
          "absolute top-0 left-1/2 -translate-x-2/4 -translate-y-2 " +
          "border-4 border-transparent border-b-green-900"
        }
      />
      {props.children}
    </CaptionBox>
  );
}

export function CaptionBox(props: Props){
  return (
    <div
      className={
        "text-center opacity-90 " +
        "bg-green-900 p-1 text-white text-xs rounded min-w-max z-1 " +
        (props.className || "")
      }
    >
      {props.children}
    </div>
  );
}
