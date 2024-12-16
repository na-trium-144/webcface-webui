import { RobotModel } from "webcface";
import { useEffect, useRef } from "react";
import { Canvas3DCardImpl } from "./canvas3DCard";

interface Props {
  robotModel: RobotModel;
}
export function RobotModelCard(props: Props) {
  const hasUpdate = useRef<boolean>(true);
  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.robotModel.on(update);
    props.robotModel.request();
    return () => props.robotModel.off(update);
  }, [props.robotModel]);
  return (
    <Canvas3DCardImpl
      titlePre={props.robotModel.member.name}
      title={props.robotModel.name}
      hasUpdate={hasUpdate}
      geometries={props.robotModel.get().map((ln) => ({
        link: ln,
        geometry: ln.geometry,
        color: ln.color,
        origin: ln.originFromBase,
      }))}
    />
  );
}
