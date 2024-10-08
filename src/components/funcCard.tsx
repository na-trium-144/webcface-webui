import { useState, useEffect, useRef, Fragment } from "react";
import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Member, Func, Arg, valType, Client } from "webcface";
import { useFuncResult } from "./funcResultProvider";
import { Input } from "./input";
import { Button, IconButton } from "./button";
import { iconFillColor } from "./sideMenu";
import { Pin, Pushpin, Search } from "@icon-park/react";
import { LocalStorage, useLocalStorage } from "./lsProvider";

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

  return <FuncList name={props.member.name} funcs={props.member.funcs()} />;
}

export function PinnedFuncCard(props: { wcli: Client | null }) {
  const ls: LocalStorage = useLocalStorage();
  const [funcs, setFuncs] = useState<Func[]>([]);
  useEffect(() => {
    if (props.wcli !== null) {
      setFuncs(
        ls.pinnedFuncs?.map((p) => props.wcli!.member(p[0]).func(p[1])) || []
      );
    }
  }, [ls.pinnedFuncs, props.wcli]);

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
    for (const f of funcs) {
      f.member.onFuncEntry.on(update);
    }
    return () => {
      for (const f of funcs) {
        f.member.onFuncEntry.off(update);
      }
    };
  }, [funcs]);

  return <FuncList name="Pinned" funcs={funcs} />;
}

interface Props2 {
  name: string;
  funcs: Func[];
}
export function FuncList(props: Props2) {
  const [searching, setSearching] = useState<boolean>(false);
  const [searchStr, setSearchStr] = useState<string>("");

  return (
    <Card title={`${props.name} Functions`}>
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <ul className="list-none">
            {props.funcs
              .filter(
                (v) =>
                  !searching ||
                  searchStr.split(" ").filter((s) => !v.name.includes(s))
                    .length === 0
              )
              .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
              .map((v) => (
                <FuncLine
                  key={v.name}
                  func={v}
                  searchStr={searching ? searchStr : ""}
                />
              ))}
          </ul>
        </div>
        <div className="flex-none relative ">
          {searching && (
            <div className="flex flex-row text-sm items-baseline pr-12 pt-2 pb-1 ">
              <span className="mr-1">Search:</span>
              <Input
                className="flex-1"
                widthClass="w-full"
                type="string"
                value={searchStr}
                setValue={(s) => setSearchStr(String(s))}
              />
            </div>
          )}
          <div className="text-lg absolute right-4 bottom-0">
            <IconButton
              onClick={() => {
                setSearching(!searching);
              }}
              caption="検索"
            >
              {searching ? (
                <Search theme="two-tone" fill={iconFillColor} />
              ) : (
                <Search />
              )}
            </IconButton>
          </div>
        </div>
      </div>
    </Card>
  );
}

function argType(
  argConfig: Arg
): "select" | "number" | "boolean" | "float" | "string" {
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
        return "string";
    }
  }
}

function FuncLine(props: { func: Func; searchStr: string }) {
  const [args, setArgs] = useState<(string | number | boolean)[]>([]);
  const [errors, setErrors] = useState<boolean[]>([]);
  const [hasArgName, setHasArgName] = useState<boolean>(false);
  const { addResult } = useFuncResult();
  const ls: LocalStorage = useLocalStorage();
  const [hasFocus, setHasFocus] = useState<boolean>(false);

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
      setHasArgName(props.func.args.some((a) => a.name !== ""));
    }
  }, [props.func, args, setArgs, errors, setErrors]);

  const searchHit = Array.from(new Array(props.func.name.length)).map(
    () => false
  );
  if (props.searchStr !== "") {
    for (const s of props.searchStr.split(" ")) {
      const si = props.func.name.indexOf(s);
      for (let i = 0; i < s.length; i++) {
        searchHit[si + i] = true;
      }
    }
  }
  const funcNameSplit: string[] = [];
  for (let f = false, i = 0; i < props.func.name.length; f = !f) {
    let j = searchHit.indexOf(!f, i);
    if (j < 0) {
      j = props.func.name.length;
    }
    funcNameSplit.push(props.func.name.slice(i, j));
    i = j;
  }

  return (
    <li className="group">
      {props.searchStr !== "" ? (
        <>
          {funcNameSplit.map((n, i) => (
            <span className={i % 2 ? "font-bold" : ""}>{n}</span>
          ))}
        </>
      ) : (
        <span>{props.func.name}</span>
      )}
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
              name={ac.name || (hasArgName ? "" : undefined)}
              type={argType(ac)}
              value={args[i]}
              setValue={(arg) =>
                setArgs(args.map((ca, ci) => (i === ci ? arg : ca)))
              }
              option={ac.option}
              min={ac.min}
              max={ac.max}
              caption={
                <ArgDescription
                  type={ac.type}
                  min={ac.min}
                  max={ac.max}
                  hasOption={Boolean(ac.option?.length)}
                  init={ac.init}
                />
              }
              onFocus={() => setHasFocus(true)}
              onBlur={() => setHasFocus(false)}
            />
            {ac.type === valType.string_ && <span>"</span>}
          </Fragment>
        ))}
      </span>
      <span className="pl-0.5 pr-2">)</span>
      <span className={hasFocus ? "" : "opacity-0 group-hover:opacity-100"}>
        <Button
          className="my-1 inline-block"
          rounded="full"
          disabled={errors.includes(true)}
          onClick={() => addResult(props.func.runAsync(...args))}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
        >
          Run
        </Button>
        {ls.pinnedFuncs?.some(
          (p) => p[0] === props.func.member.name && p[1] === props.func.name
        ) ? (
          <IconButton
            onClick={() =>
              ls.unPinFunc(props.func.member.name, props.func.name)
            }
            caption="UnPin"
            onFocus={() => setHasFocus(true)}
            onBlur={() => setHasFocus(false)}
          >
            <Pushpin theme="two-tone" fill={iconFillColor} />
          </IconButton>
        ) : (
          <IconButton
            onClick={() => ls.pinFunc(props.func.member.name, props.func.name)}
            caption="Pin"
            onFocus={() => setHasFocus(true)}
            onBlur={() => setHasFocus(false)}
          >
            <Pin />
          </IconButton>
        )}
      </span>
    </li>
  );
}

interface ArgProps {
  type?: number;
  min?: number | null;
  max?: number | null;
  hasOption?: boolean;
  init?: number | boolean | string | null;
}
export function ArgDescription(props: ArgProps) {
  const valTypeText = () => {
    switch (props.type) {
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
        {props.hasOption && " (選択式)"}
      </div>
      <div>
        {props.min != null &&
          (props.type === valType.string_
            ? `最小長さ ${props.min}`
            : `最小値 ${props.min}`)}
        {props.min != null && props.max != null && ", "}
        {props.max != null &&
          (props.type === valType.string_
            ? `最大長さ ${props.max}`
            : `最大値 ${props.max}`)}
      </div>
      <div>{props.init != null && `初期値 ${String(props.init)}`}</div>
    </>
  );
}
