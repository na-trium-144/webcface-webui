import { useEffect } from "react";
import { Caption } from "./caption";

const inputClass = "border-0 outline-0 px-1 peer ";

interface Props {
  isError: boolean;
  setIsError: (error: boolean) => void;
  name?: string;
  type: "select" | "number" | "float" | "string" | "boolean";
  value: string | number | boolean;
  setValue: (value: string | number | boolean) => void;
  option?: string[] | number[];
  min?: number | null;
  max?: number | null;
  caption?: ReactElement;
}
export function Input(props: Props) {
  return (
    <div className="inline-block relative pt-3">
      {props.type === "select" ? (
        <SelectInput {...props} />
      ) : props.type === "number" ? (
        <NumberInput {...props} />
      ) : props.type === "float" ? (
        <FloatInput {...props} />
      ) : props.type === "boolean" ? (
        <BooleanInput {...props} />
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
      className={inputClass + "px-0 "}
      value={String(props.value)}
      onChange={(e) => props.setValue(e.target.value)}
    >
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
      className={inputClass + "w-20"}
      value={(props.value as number) || 0}
      min={props.min != null ? props.min : undefined}
      max={props.max != null ? props.max : undefined}
      onChange={(e) => {
        props.setIsError(!e.target.checkValidity());
        props.setValue(e.target.value);
      }}
    />
  );
}

function BooleanInput(props: Props) {
  return (
    <button
      type="button"
      onClick={() => props.setValue(!props.value)}
      className={
        inputClass +
        "cursor-pointer inline-block pl-1 w-12 " +
        "hover:text-green-700 active:text-green-700 "
      }
    >
      {props.value ? "true" : "false"}
    </button>
  );
}

function FloatInput(props: Props) {
  useEffect(() => {
    props.setIsError(
      props.value === "" || 
      isNaN(Number(props.value)) ||
        (props.min != null && props.min > Number(props.value)) ||
        (props.max != null && props.max < Number(props.value))
    );
  }, [props.value, props.min, props.max]);
  return (
    <input
      type="text"
      className={inputClass}
      size={6}
      value={String(props.value)}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
    />
  );
}

function StringInput(props: Props) {
  useEffect(() => {
    props.setIsError(
      (props.min != null && props.min > String(props.value).length) ||
        (props.max != null && props.max < String(props.value).length)
    );
  }, [props.value, props.min, props.max]);
  return (
    <input
      type="text"
      className={inputClass}
      size={6}
      value={String(props.value)}
      onChange={(e) => {
        props.setValue(e.target.value);
      }}
    />
  );
}
