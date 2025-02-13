import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Text, View, ViewComponent, viewComponentTypes } from "webcface";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useFuncResult } from "./funcResultProvider";
import { textColorClass } from "../libs/color";
import { Button } from "./button";
import { Input } from "./input";
import { Slider } from "./slider";
import { ArgDescription } from "./funcCard";

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
    <Card titlePre={props.view.member.name} title={props.view.name}>
      <div className="w-full h-full overflow-y-auto overflow-x-auto">
        {props.view.get().map((vc) => (
          <ViewComponentRender
            key={vc.id}
            vc={vc}
            id={`${props.view.member.name}:${props.view.name}:${vc.id}`}
          />
        ))}
      </div>
    </Card>
  );
}

interface VCProps {
  vc: ViewComponent;
  id: string;
}
function ViewComponentRender(props: VCProps) {
  const { addResult } = useFuncResult();
  const bind = useRef<Text | null>(null);
  const [tempValue, setTempValue] = useState<string | number | boolean | null>(
    null
  );
  const [isError, setIsError] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);
  const sendValue = (val: string | number | boolean | null) => {
    if (bind.current?.getAny() !== val && val !== null) {
      const r = props.vc.onChange?.runAsync(val);
      if (r != null) {
        addResult(r);
      }
    }
  };
  useEffect(() => {
    switch (props.vc.type) {
      case viewComponentTypes.textInput:
      case viewComponentTypes.decimalInput:
      case viewComponentTypes.numberInput:
      case viewComponentTypes.selectInput:
      case viewComponentTypes.toggleInput:
      case viewComponentTypes.sliderInput:
      case viewComponentTypes.checkInput:
        if (!focused) {
          bind.current = props.vc.bind;
          const bindCurrent = bind.current;
          if (bindCurrent) {
            if (tempValue !== bindCurrent.getAny()) {
              setTempValue(bindCurrent.getAny());
            } else {
              const onChange = () => {
                setTempValue(bindCurrent.getAny());
              };
              bindCurrent.on(onChange);
              return () => bindCurrent.off(onChange);
            }
          }
        }
        break;
      default:
        break;
    }
  }, [props.vc, tempValue, focused]);

  const sizeStyle = {
    width: props.vc.width > 0 ? props.vc.width + "em" : undefined,
    height: props.vc.height > 0 ? props.vc.height + "em" : undefined,
  };
  const buttonSizeStyle = {
    width: props.vc.width > 0 ? props.vc.width + "em" : undefined,
    height: props.vc.height > 0 ? 1 + props.vc.height + "em" : undefined,
  };
  switch (props.vc.type) {
    case viewComponentTypes.text:
      return (
        <span className={textColorClass(props.vc.textColor)} style={sizeStyle}>
          {props.vc.text}
        </span>
      );
    case viewComponentTypes.newLine:
      return <br />;
    case viewComponentTypes.button:
      return (
        <Button
          className="m-1"
          buttonStyle={buttonSizeStyle}
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
    case viewComponentTypes.decimalInput:
    case viewComponentTypes.numberInput:
    case viewComponentTypes.toggleInput:
    case viewComponentTypes.selectInput:
      return (
        <Input
          width={props.vc.width}
          height={props.vc.height}
          isError={isError}
          setIsError={setIsError}
          name={props.vc.text}
          type={
            props.vc.type === viewComponentTypes.textInput
              ? props.vc.height >= 2
                ? "multiline"
                : "string"
              : props.vc.type === viewComponentTypes.decimalInput
              ? "float"
              : props.vc.type === viewComponentTypes.numberInput
              ? "number"
              : props.vc.type === viewComponentTypes.selectInput
              ? "select"
              : props.vc.type === viewComponentTypes.toggleInput
              ? "boolean"
              : "string"
          }
          value={tempValue != null ? tempValue : ""}
          setValue={(val) => {
            setTempValue(val);
            if (
              props.vc.type === viewComponentTypes.toggleInput ||
              props.vc.type === viewComponentTypes.selectInput
            ) {
              sendValue(val);
            }
          }}
          min={props.vc.min}
          max={props.vc.max}
          step={props.vc.step}
          option={props.vc.option}
          onFocus={() =>
            props.vc.type !== viewComponentTypes.toggleInput &&
            props.vc.type !== viewComponentTypes.selectInput &&
            setFocused(true)
          }
          onBlur={() => {
            if (
              props.vc.type !== viewComponentTypes.toggleInput &&
              props.vc.type !== viewComponentTypes.selectInput
            ) {
              setFocused(false);
              if (!isError) {
                sendValue(tempValue);
              }
            }
          }}
          onKeyUp={(e: KeyboardEvent) => {
            if (e.key === "Enter") {
              if (!isError) {
                sendValue(tempValue);
              }
            }
          }}
          caption={
            props.vc.min != null ||
            props.vc.max != null ||
            props.vc.option?.length ? (
              <ArgDescription
                min={props.vc.min}
                max={props.vc.max}
                hasOption={Boolean(props.vc.option?.length)}
              />
            ) : null
          }
        />
      );
    case viewComponentTypes.sliderInput:
      return (
        <Slider
          className="w-32 align-text-bottom mb-0.5"
          style={sizeStyle}
          value={typeof tempValue === "number" ? tempValue : 0}
          onAfterChange={(val) => {
            setTempValue(val);
            sendValue(val);
          }}
          min={props.vc.min || 0}
          max={props.vc.max != null ? props.vc.max : 100}
          step={props.vc.step || 1}
        />
      );
    case viewComponentTypes.checkInput:
      return (
        <>
          <input
            type="checkbox"
            id={props.id}
            checked={!!tempValue}
            onChange={(e) => {
              setTempValue(e.target.checked);
              sendValue(e.target.checked);
            }}
          />
          <label htmlFor={props.id}>{props.vc.text}</label>
        </>
      );
  }
}
