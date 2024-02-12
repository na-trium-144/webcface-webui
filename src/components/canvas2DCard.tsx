import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Canvas2D, geometryType } from "webcface";
import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Text, Circle, Line } from "react-konva";

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
      <div ref={divRef} className="h-full w-full">
        <Stage width={divWidth} height={divHeight}>
          <Layer>
            {props.canvas.get().map((c, ci) => {
              switch (c.geometry.type) {
                case geometryType.line:
                  return (
                    <Line
                      key={ci}
                      x={0}
                      y={0}
                      points={[
                        resize(c.geometry.asLine.begin.pos[0]),
                        resize(c.geometry.asLine.begin.pos[1]),
                        resize(c.geometry.asLine.end.pos[0]),
                        resize(c.geometry.asLine.end.pos[1]),
                      ]}
                      stroke="black"
                    />
                  );
                case geometryType.plane:
                  return (
                    <Rect
                      key={ci}
                      x={resize(
                        c.geometry.asRect.origin.pos[0] -
                          c.geometry.asRect.width / 2
                      )}
                      y={resize(
                        c.geometry.asRect.origin.pos[1] -
                          c.geometry.asRect.height / 2
                      )}
                      width={resize(c.geometry.asRect.width)}
                      height={resize(c.geometry.asRect.height)}
                      stroke="black"
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
