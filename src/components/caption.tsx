import { ReactElement } from "react";

interface Props {
  children: ReactElement;
}
export function Caption(props: Props) {
  return (
    <div
      className={
        "absolute top-full left-1/2 -translate-x-2/4 translate-y-2 text-center opacity-90 " +
        "hidden peer-focus:inline-block peer-hover:inline-block " +
        "bg-green-900 p-1 text-white text-xs rounded min-w-max z-1 "
      }
    >
      <span
        className={
          "absolute top-0 left-1/2 -translate-x-2/4 -translate-y-2 " +
          "border-4 border-transparent border-b-green-900"
        }
      />
      {props.children}
    </div>
  );
}
