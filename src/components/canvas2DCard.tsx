import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import {
  Canvas2D,
  Canvas2DComponent,
  geometryType,
  Transform,
  Point,
} from "webcface";
import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Circle, Line } from "react-konva";
import { colorName } from "../libs/color";
import { multiply } from "../libs/math";
import { useFuncResult } from "./funcResultProvider";

interface Props {
  canvas: Canvas2D;
}
export function Canvas2DCard(props: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [divWidth, setDivWidth] = useState<number>(0);
  const [divHeight, setDivHeight] = useState<number>(0);
  const hasUpdate = useRef<boolean>(true);
  const update = useForceUpdate();

  useEffect(() => {
    const i = setInterval(() => {
      if (hasUpdate.current) {
        update();
        hasUpdate.current = false;
      }
      if (
        divRef.current != null &&
        (divRef.current.clientWidth !== divWidth ||
          divRef.current.clientHeight !== divHeight)
      ) {
        setDivWidth(divRef.current.clientWidth);
        setDivHeight(divRef.current.clientHeight);
      }
    }, 50);
    return () => clearInterval(i);
  }, [divWidth, divHeight, update]);

  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.canvas.on(update);
    return () => props.canvas.off(update);
  }, [props.canvas]);

  const resize = (x: number) => {
    if (props.canvas.width && props.canvas.height) {
      const xRatio = divWidth / props.canvas.width;
      const yRatio = divHeight / props.canvas.height;
      return Math.min(xRatio, yRatio) * x;
    }
    return 1; // 適当
  };
  return (
    <Card title={`${props.canvas.member.name}:${props.canvas.name}`}>
      <div ref={divRef} className="h-full w-full flex">
        <Stage
          width={divWidth}
          height={divHeight}
          style={{
            width: resize(props.canvas.width || 1),
            height: resize(props.canvas.height || 1),
          }}
          className="m-auto"
        >
          <Layer>
            {props.canvas.get().map((c, ci) => (
              <Shape key={ci} c={c} resize={resize} />
            ))}
          </Layer>
        </Stage>
      </div>
    </Card>
  );
}

interface ShapeProps {
  c: Canvas2DComponent;
  resize: (x: number) => number;
}
function Shape(props: ShapeProps) {
  const { c, resize } = props;
  const { addResult } = useFuncResult();
  const mv = (pos: Point) =>
    new Transform(multiply(c.origin.tfMatrix, new Transform(pos.pos).tfMatrix));
  const konvaProps = {
    stroke: c.color ? colorName[c.color] : "black",
    fill: c.fillColor ? colorName[c.fillColor] : undefined,
    strokeWidth: resize(c.strokeWidth),
    listening: !!c.onClick,
    onClick: () => c.onClick && addResult(c.onClick.runAsync()),
  };
  switch (c.geometry.type) {
    case geometryType.line:
      return (
        <Line
          x={0}
          y={0}
          points={[
            resize(mv(c.geometry.asLine.begin).pos[0]),
            resize(mv(c.geometry.asLine.begin).pos[1]),
            resize(mv(c.geometry.asLine.end).pos[0]),
            resize(mv(c.geometry.asLine.end).pos[1]),
          ]}
          {...konvaProps}
        />
      );
    case geometryType.plane: {
      const x = c.geometry.asRect.origin.pos[0];
      const y = c.geometry.asRect.origin.pos[1];
      const w = c.geometry.asRect.width;
      const h = c.geometry.asRect.height;
      const p = [
        [x - w / 2, y - h / 2],
        [x - w / 2, y + h / 2],
        [x + w / 2, y + h / 2],
        [x + w / 2, y - h / 2],
      ];
      return (
        <Line
          x={0}
          y={0}
          points={p.reduce(
            (prev, xy) =>
              prev.concat([
                resize(mv(new Point(xy)).pos[0]),
                resize(mv(new Point(xy)).pos[1]),
              ]),
            [] as number[]
          )}
          closed
          {...konvaProps}
        />
      );
    }
    case geometryType.polygon: {
      return (
        <Line
          x={0}
          y={0}
          points={c.geometry.asPolygon.points.reduce(
            (prev, xy) =>
              prev.concat([resize(mv(xy).pos[0]), resize(mv(xy).pos[1])]),
            [] as number[]
          )}
          closed
          {...konvaProps}
        />
      );
    }
    case geometryType.circle:
      return (
        <Circle
          x={resize(mv(c.geometry.asCircle.origin).pos[0])}
          y={resize(mv(c.geometry.asCircle.origin).pos[1])}
          radius={resize(c.geometry.asCircle.radius)}
          {...konvaProps}
        />
      );
    default:
      return null;
  }
}
