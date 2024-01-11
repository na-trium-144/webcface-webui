import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { View, ViewComponent, viewColor, viewComponentTypes } from "webcface";
import { useEffect, useRef } from "react";
import { useFuncResult } from "./funcResultProvider";
import { bgButtonColorClass, textColorClass } from "../libs/color";
import { Button } from "./button";

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
        >
          {props.vc.text}
        </Button>
      );
  }
}
