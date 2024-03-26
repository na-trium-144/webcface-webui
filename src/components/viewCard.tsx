import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Text, View, ViewComponent, viewComponentTypes } from "webcface";
import { useState, useEffect, useRef } from "react";
import { useFuncResult } from "./funcResultProvider";
import { textColorClass } from "../libs/color";
import { Button } from "./button";
import { Input } from "./input";

interface Props {
  view: View;
}
export function ViewCard(props: Props) {
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
    props.view.on(update);
    return () => props.view.off(update);
  }, [props.view, update]);
  return (
    <Card title={`${props.view.member.name}:${props.view.name}`}>
      <div className="w-full h-full overflow-y-auto overflow-x-auto">
        {props.view.get().map((vc, i) => (
          <ViewComponentRender key={i} vc={vc} />
        ))}
      </div>
    </Card>
  );
}

interface VCProps {
  vc: ViewComponent;
}
function ViewComponentRender(props: VCProps) {
  const { addResult } = useFuncResult();
  const [tempValue, setTempValue] = useState<string | number | boolean | null>(
    null
  );
  const [isError, setIsError] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  useEffect(() => {
    switch (props.vc.type) {
      case viewComponentTypes.textInput:
        if (!focused) {
          const bind = props.vc.bind;
          if (tempValue !== bind.getAny()) {
            setTempValue(bind.getAny());
          } else {
            const onChange = () => {
              setTempValue(bind.getAny());
            };
            bind.on(onChange);
            return () => bind.off(onChange);
          }
        }
        break;
      default:
        break;
    }
  }, [props.vc, tempValue, focused]);

  switch (props.vc.type) {
    case viewComponentTypes.text:
      return (
        <span className={textColorClass(props.vc.textColor)}>
          {props.vc.text}
        </span>
      );
    case viewComponentTypes.newLine:
      return <br />;
    case viewComponentTypes.button:
      return (
        <Button
          onClick={() => {
            const r = props.vc.onClick?.runAsync();
            if (r != null) {
              addResult(r);
            }
          }}
          bgColor={props.vc.bgColor}
          textColor={props.vc.textColor}
        >
          {props.vc.text}
        </Button>
      );
    case viewComponentTypes.textInput:
    case viewComponentTypes.numInput:
    case viewComponentTypes.intInput:
      return (
        <Input
          isError={isError}
          setIsError={setIsError}
          name={props.vc.text}
          type={
            props.vc.type === viewComponentTypes.textInput
              ? "string"
              : props.vc.type === viewComponentTypes.numInput
              ? "float"
              : props.vc.type === viewComponentTypes.intInput
              ? "number"
              : "string"
          }
          value={tempValue != null ? tempValue : ""}
          setValue={(val) => setTempValue(val)}
          min={props.vc.min}
          max={props.vc.max}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (!isError) {
              const r = props.vc.onChange?.runAsync(tempValue);
              if (r != null) {
                addResult(r);
              }
            }
          }}
        />
      );
  }
}
