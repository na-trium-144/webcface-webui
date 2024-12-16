import { ReactNode } from "react";
interface Props {
  titlePre?: string;
  title: string;
  children: ReactNode;
}
export function Card(props: Props) {
  return (
    <div
      className={
        "flex flex-col rounded-md border border-neutral-200 " +
        "bg-white w-full h-full shadow-md"
      }
    >
      <div
        className={
          "flex-none p-1 text-center overflow-hidden text-ellipsis text-nowrap " +
          "cursor-grab active:cursor-grabbing MyCardHandle " +
          "hover:shadow rounded-t-md "
        }
        style={{direction: "rtl"}}
      >
        <h3 className="text-center font-semibold inline "
        style={{direction: "ltr", unicodeBidi: "bidi-override"}}>
          {props.titlePre && (
            <span className="text-xs mr-1">{props.titlePre}</span>
          )}
          {props.title}
        </h3>
      </div>
      <div className="flex-1 p-1 min-h-0 ">{props.children}</div>
    </div>
  );
}
