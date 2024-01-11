import { useState, useEffect, useRef, Fragment } from "react";
import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Member, Func, Arg, valType } from "webcface";
import { useFuncResult } from "./funcResultProvider";
import { Input } from "./input";
import { Button } from "./button";

interface Props {
  member: Member;
}
export function FuncCard(props: Props) {
  const hasUpdate = useRef<boolean>(true);
  const update = useForceUpdate();
  useEffect(() => {
    const i = setInterval(() => {
      if (hasUpdate.current) {
        update();
        hasUpdate.current = false;
      }
    }, 50);
    return () => clearInterval(i);
  }, [update]);
  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.member.onFuncEntry.on(update);
    return () => {
      props.member.onFuncEntry.off(update);
    };
  }, [props.member, update]);
  return (
    <Card title={`${props.member.name} Functions`}>
      <div className="h-full overflow-y-auto">
        <ul className="list-none">
          {props.member
            .funcs()
            .slice()
            .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
            .map((v) => (
              <li key={v.name}>
                <FuncLine func={v} />
              </li>
            ))}
        </ul>
      </div>
    </Card>
  );
}

function argType(
  argConfig: Arg
): "select" | "number" | "boolean" | "float" | "text" {
  if (argConfig.option && argConfig.option.length > 0) {
    return "select";
  } else {
    switch (argConfig.type) {
      case valType.int_:
        return "number";
      case valType.boolean_:
        return "boolean";
      case valType.float_:
        return "float";
      default:
        return "text";
    }
  }
}

function FuncLine(props: { func: Func }) {
  const [args, setArgs] = useState<(string | number | boolean)[]>([]);
  const [errors, setErrors] = useState<boolean[]>([]);
  const { addResult } = useFuncResult();
  useEffect(() => {
    if (args.length < props.func.args.length) {
      setArgs(
        props.func.args.map((ac, i) => {
          if (i < args.length) {
            return args[i];
          } else if (ac.init != null) {
            return ac.init;
          } else if (ac.option && ac.option.length > 0) {
            return ac.option[0];
          } else {
            switch (ac.type) {
              case valType.int_:
              case valType.float_:
                return 0;
              case valType.boolean_:
                return false;
              default:
                return "";
            }
          }
        })
      );
      setErrors(
        props.func.args.map((_, i) => {
          if (i < args.length) {
            return errors[i];
          } else {
            return false;
          }
        })
      );
    }
  }, [props.func, args, setArgs, errors, setErrors]);

  return (
    <>
      <span>{props.func.name}</span>
      <span className="pl-1 pr-0.5">(</span>
      <span>
        {props.func.args.map((ac, i) => (
          <Fragment key={i}>
            <span className="pl-1 pr-1 first:hidden">,</span>
            {ac.type === valType.string_ && <span>"</span>}
            <Input
              isError={errors[i]}
              setIsError={(isError) =>
                setErrors(errors.map((ce, ci) => (i === ci ? isError : ce)))
              }
              name={ac.name || ""}
              type={argType(ac)}
              value={args[i]}
              setValue={(arg) =>
                setArgs(args.map((ca, ci) => (i === ci ? arg : ca)))
              }
              option={ac.option}
              min={ac.min}
              max={ac.max}
              caption={<ArgDescription argConfig={ac} />}
            />
            {ac.type === valType.string_ && <span>"</span>}
          </Fragment>
        ))}
      </span>
      <span className="pl-0.5 pr-2">)</span>
      <Button
        className="my-1 inline-block"
        rounded="full"
        disabled={errors.includes(true)}
        onClick={() => addResult(props.func.runAsync(...args))}
      >
        Run
      </Button>
    </>
  );
}

function ArgDescription(props: { argConfig: Arg }) {
  const valTypeText = () => {
    switch (props.argConfig.type) {
      case valType.int_:
        return "整数型";
      case valType.float_:
        return "実数型";
      case valType.boolean_:
        return "真偽値型";
      case valType.string_:
        return "文字列型";
      default:
        return "";
    }
  };
  return (
    <>
      <div>
        {valTypeText()}
        {props.argConfig.option &&
          props.argConfig.option.length > 0 &&
          " (選択式)"}
      </div>
      <div>
        {props.argConfig.min != null &&
          (props.argConfig.type === valType.string_
            ? `最小長さ ${props.argConfig.min}`
            : `最小値 ${props.argConfig.min}`)}
        {props.argConfig.min != null && props.argConfig.max != null && ", "}
        {props.argConfig.max != null &&
          (props.argConfig.type === valType.string_
            ? `最大長さ ${props.argConfig.max}`
            : `最大値 ${props.argConfig.max}`)}
      </div>
      <div>
        {props.argConfig.init != null &&
          `初期値 ${String(props.argConfig.init)}`}
      </div>
    </>
  );
}
