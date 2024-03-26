import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { View, ViewComponent, viewComponentTypes } from "webcface";
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
  const [tempValue, setTempValue] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  useEffect(() => {
    if (props.vc.onChange !== null) {
      if (!focused) {
        const i = setInterval(() => {
          const newValue = props.vc.getBindValue();
          if (tempValue !== newValue) {
            setTempValue(newValue);
          }
        }, 50);
        return () => clearInterval(i);
      }
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
      if (props.vc.options?.length) {
        return null;
      } else {
        return (
          <Input
            isError={isError}
            setIsError={setIsError}
            name={props.vc.text}
            type="string"
            value={tempValue}
            setValue={(val) => setTempValue(val == null ? "" : String(val))}
            min={props.vc.min}
            max={props.vc.max}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              const r = props.vc.onChange?.runAsync(tempValue);
              if (r != null) {
                addResult(r);
              }
            }}
          />
        );
      }
  }
}
