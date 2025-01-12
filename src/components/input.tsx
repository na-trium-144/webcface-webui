import { useEffect, ReactNode, KeyboardEvent } from "react";
import { Caption } from "./caption";

const inputClass = "border-0 outline-0 px-1 peer ";

interface Props {
  isError?: boolean;
  setIsError?: (error: boolean) => void;
  className?: string;
  widthClass?: string;
  width?: number;
  height?: number;
  name?: string;
  type: "select" | "number" | "float" | "string" | "boolean" | "multiline";
  value: string | number | boolean;
  setValue: (value: string | number | boolean) => void;
  option?: (string | number)[];
  min?: number | null;
  max?: number | null;
  step?: number | null;
  caption?: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyUp?: (e: KeyboardEvent) => void;
}
export function Input(props: Props) {
  return (
    <div
      className={
        "inline-block relative " +
        (props.name !== undefined ? "pt-3 " : "") +
        (props.className !== undefined ? props.className : "")
      }
    >
      {props.type === "select" ? (
        <SelectInput {...props} />
      ) : props.type === "number" ? (
        <NumberInput {...props} />
      ) : props.type === "float" ? (
        <FloatInput {...props} />
      ) : props.type === "boolean" ? (
        <BooleanInput {...props} />
      ) : props.type === "multiline" ? (
        <MultiLineInput {...props} />
      ) : (
        <StringInput {...props} />
      )}
      <span
        className={
          "absolute bottom-0 inset-x-0 " +
          "border-b peer-focus:border-b-2 px-1 peer " +
          (props.isError
            ? "border-red-500 peer-hover:border-red-500 peer-focus:border-red-500 "
            : "border-neutral-200 peer-hover:border-neutral-500 peer-focus:border-black ")
        }
      />
      <span
        className={
          "absolute top-0 left-0.5 text-xs " +
          "text-neutral-400 peer-focus:text-black "
        }
      >
        {props.name}
      </span>
      {props.caption && <Caption>{props.caption}</Caption>}
    </div>
  );
}

function SelectInput(props: Props) {
  return (
    <select
      className={
        inputClass +
        "px-0 " +
        (props.widthClass != undefined ? props.widthClass : "")
      }
      style={{
        width: props.width && props.width > 0 ? props.width + "em" : undefined,
      }}
      value={String(props.value)}
      onChange={(e) => props.setValue(e.target.value)}
      onFocus={() => props.onFocus && props.onFocus()}
      onBlur={() => props.onBlur && props.onBlur()}
    >
      {props.option?.find((o) => String(o) === String(props.value)) == null && (
        <option value={String(props.value)}>{String(props.value)}</option>
      )}
      {props.option?.map((o, oi) => (
        <option key={oi} value={String(o)}>
          {String(o)}
        </option>
      ))}
    </select>
  );
}

function NumberInput(props: Props) {
  return (
    <input
      type="number"
      className={
        inputClass +
        (props.widthClass != undefined ? props.widthClass : "w-20 ")
      }
      size={props.width && props.width > 0 ? props.width : 6}
      value={(props.value as number) || 0}
      min={props.min != null ? props.min : undefined}
      max={props.max != null ? props.max : undefined}
      step={props.step != null ? props.step : 1}
      onChange={(e) => {
        if (props.setIsError) {
          props.setIsError(!e.target.checkValidity());
        }
        props.setValue(e.target.value);
      }}
      onFocus={() => props.onFocus && props.onFocus()}
      onBlur={() => props.onBlur && props.onBlur()}
      onKeyUp={(e: KeyboardEvent) => props.onKeyUp && props.onKeyUp(e)}
    />
  );
}

function BooleanInput(props: Props) {
  const option: (string | number | boolean)[] =
    props.option && props.option.length > 0 ? props.option : [false, true];
  return (
    <button
      type="button"
      onClick={() =>
        props.setValue(
          option[(option.indexOf(props.value) + 1) % option.length]
        )
      }
      className={
        inputClass +
        "cursor-pointer inline-block pl-1 relative " +
        "hover:text-green-700 active:text-green-700 " +
        (props.widthClass != undefined ? props.widthClass : "w-12 ")
      }
      style={{
        width: props.width && props.width > 0 ? props.width + "em" : undefined,
        height:
          props.height && props.height > 0 ? props.height + "em" : undefined,
      }}
      onFocus={() => props.onFocus && props.onFocus()}
      onBlur={() => props.onBlur && props.onBlur()}
    >
      {/*props.valueが空でもbaselineが揃うようにダミーのテキストを入れる*/}
      {option.map((o) => (
        <div className="text-transparent select-none h-0">{String(o)}</div>
      ))}
      <span className="absolute inset-x-0 ">{String(props.value)}</span>
    </button>
  );
}

function FloatInput(props: Props) {
  useEffect(() => {
    if (props.setIsError) {
      props.setIsError(
        props.value === "" ||
          isNaN(Number(props.value)) ||
          (props.min != null && props.min > Number(props.value)) ||
          (props.max != null && props.max < Number(props.value))
      );
    }
  }, [props.value, props.min, props.max, props.setIsError]);
  return (
    <input
      type="text"
      className={
        inputClass + (props.widthClass != undefined ? props.widthClass : "")
      }
      size={props.width && props.width > 0 ? props.width : 6}
      value={String(props.value)}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
      onFocus={() => props.onFocus && props.onFocus()}
      onBlur={() => props.onBlur && props.onBlur()}
      onKeyUp={(e: KeyboardEvent) => props.onKeyUp && props.onKeyUp(e)}
    />
  );
}

function StringInput(props: Props) {
  useEffect(() => {
    if (props.setIsError) {
      props.setIsError(
        (props.min != null && props.min > String(props.value).length) ||
          (props.max != null && props.max < String(props.value).length)
      );
    }
  }, [props.setIsError, props.value, props.min, props.max]);
  return (
    <input
      type="text"
      className={
        inputClass + (props.widthClass != undefined ? props.widthClass : "")
      }
      size={props.width && props.width > 0 ? props.width : 6}
      value={String(props.value)}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
      onFocus={() => props.onFocus && props.onFocus()}
      onBlur={() => props.onBlur && props.onBlur()}
      onKeyUp={(e: KeyboardEvent) => props.onKeyUp && props.onKeyUp(e)}
    />
  );
}

function MultiLineInput(props: Props) {
  useEffect(() => {
    if (props.setIsError) {
      props.setIsError(
        (props.min != null && props.min > String(props.value).length) ||
          (props.max != null && props.max < String(props.value).length)
      );
    }
  }, [props.setIsError, props.value, props.min, props.max]);
  return (
    <textarea
      className={
        inputClass +
        "resize-none align-middle " +
        (props.widthClass != undefined ? props.widthClass : "")
      }
      rows={props.height && props.height > 0 ? props.height : 1}
      cols={props.width && props.width > 0 ? props.width : 6}
      value={String(props.value)}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
      onFocus={() => props.onFocus && props.onFocus()}
      onBlur={() => props.onBlur && props.onBlur()}
      onKeyUp={(e: KeyboardEvent) => props.onKeyUp && props.onKeyUp(e)}
    />
  );
}
