import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Canvas2D, geometryType, Transform, Point } from "webcface";
import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Text, Circle, Line } from "react-konva";
import { colorName } from "../libs/color";
import { multiply, inv } from "../libs/math";

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
    const xRatio = divWidth / props.canvas.width;
    const yRatio = divHeight / props.canvas.height;
    return Math.min(xRatio, yRatio) * x;
  };
  return (
    <Card title={`${props.canvas.member.name}:${props.canvas.name}`}>
      <div ref={divRef} className="h-full w-full flex">
        <Stage
          width={divWidth}
          height={divHeight}
          style={{
            width: resize(props.canvas.width),
            height: resize(props.canvas.height),
          }}
          className="m-auto"
        >
          <Layer>
            {props.canvas.get().map((c, ci) => {
              const stroke = c.color ? colorName[c.color] : "black";
              const fill = c.fill ? colorName[c.fill] : "transparent";
              const mv = (pos: Point) =>
                new Transform(
                  multiply(c.origin.tfMatrix, new Transform(pos.pos).tfMatrix)
                );
              switch (c.geometry.type) {
                case geometryType.line:
                  return (
                    <Line
                      key={ci}
                      x={0}
                      y={0}
                      points={[
                        resize(mv(c.geometry.asLine.begin).pos[0]),
                        resize(mv(c.geometry.asLine.begin).pos[1]),
                        resize(mv(c.geometry.asLine.end).pos[0]),
                        resize(mv(c.geometry.asLine.end).pos[1]),
                      ]}
                      stroke={stroke}
                      strokeWidth={resize(c.strokeWidth)}
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
                      key={ci}
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
                      stroke={stroke}
                      fill={fill}
                      strokeWidth={resize(c.strokeWidth)}
                    />
                  );
                }
                case geometryType.polygon: {
                  return (
                    <Line
                      key={ci}
                      x={0}
                      y={0}
                      points={c.geometry.asPolygon.points.reduce(
                        (prev, xy) =>
                          prev.concat([
                            resize(mv(xy).pos[0]),
                            resize(mv(xy).pos[1]),
                          ]),
                        [] as number[]
                      )}
                      closed
                      stroke={stroke}
                      fill={fill}
                      strokeWidth={resize(c.strokeWidth)}
                    />
                  );
                }
                case geometryType.circle:
                  return (
                    <Circle
                      key={ci}
                      x={resize(mv(c.geometry.asCircle.origin).pos[0])}
                      y={resize(mv(c.geometry.asCircle.origin).pos[1])}
                      radius={resize(c.geometry.asCircle.radius)}
                      stroke={stroke}
                      fill={fill}
                      strokeWidth={resize(c.strokeWidth)}
                    />
                  );
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>
    </Card>
  );
}
