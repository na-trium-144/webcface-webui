import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import {
  Canvas2D,
  Canvas2DComponent,
  geometryType,
  Transform,
  Point,
  viewColor,
} from "webcface";
import { useState, useEffect, useRef, PointerEvent } from "react";
import { Stage, Layer, Circle, Line } from "react-konva";
import { colorName, colorNameHover } from "../libs/color";
import { multiply } from "../libs/math";
import { useFuncResult } from "./funcResultProvider";

interface Props {
  canvas: Canvas2D;
}
export function Canvas2DCard(props: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [divWidth, setDivWidth] = useState<number>(0);
  const [divHeight, setDivHeight] = useState<number>(0);
  const [ratio, setRatio] = useState<number>(1);
  const canvas2dWidth = useRef<number>(0);
  const canvas2dHeight = useRef<number>(0);
  const hasUpdate = useRef<boolean>(true);
  const update = useForceUpdate();
  const [cursor, setCursor] = useState<string>("default");
  const [pointerPos, setPointerPos] = useState<null | { x: number; y: number }>(
    null
  );
  useEffect(() => {
    const i = setInterval(() => {
      if (hasUpdate.current) {
        update();
        hasUpdate.current = false;
      }
      if (
        divRef.current?.clientWidth !== divWidth ||
        divRef.current?.clientHeight !== divHeight ||
        canvas2dWidth.current !== props.canvas.width ||
        canvas2dHeight.current !== props.canvas.height
      ) {
        if (divRef.current) {
          setDivWidth(divRef.current.clientWidth);
          setDivHeight(divRef.current.clientHeight);
        }
        canvas2dWidth.current = props.canvas.width;
        canvas2dHeight.current = props.canvas.height;
        if (props.canvas.width && props.canvas.height) {
          const xRatio = divRef.current.clientWidth / props.canvas.width;
          const yRatio = divRef.current.clientHeight / props.canvas.height;
          setRatio(Math.min(xRatio, yRatio));
        }
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

  // canvas2d座標系からdom座標系へ変換 (拡大縮小のみ)
  const resize = (x: number) => ratio * x;
  // dom座標系でのcanvasの幅と高さ
  const canvasWidth = resize(props.canvas.width || 1);
  const canvasHeight = resize(props.canvas.height || 1);

  const onPointerMove = (e: PointerEvent) => {
    const divPos = e.currentTarget.getBoundingClientRect();
    setPointerPos({
      x: (e.clientX - divPos.left - (divWidth - canvasWidth) / 2) / ratio,
      y: (e.clientY - divPos.top - (divHeight - canvasHeight) / 2) / ratio,
    });
  };

  return (
    <Card title={`${props.canvas.member.name}:${props.canvas.name}`}>
      <div className="h-full w-full flex flex-col">
        <div
          ref={divRef}
          className="flex-1 max-h-full w-full"
          onPointerMove={onPointerMove}
          onPointerEnter={onPointerMove}
        >
          <Stage
            width={divWidth}
            height={divHeight}
            style={{
              width: canvasWidth,
              height: canvasHeight,
              cursor: cursor,
            }}
            className="m-auto"
          >
            <Layer>
              {props.canvas.get().map((c, ci) => (
                <Shape
                  key={ci}
                  c={c}
                  resize={resize}
                  setCursor={(c: string) => setCursor(c)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
        <div className="flex-none h-4 text-xs">
          {pointerPos !== null && <CoordText {...pointerPos} />}
        </div>
      </div>
    </Card>
  );
}

function CoordText(props: { x: number; y: number }) {
  return (
    <>
      (<span>{props.x.toPrecision(4)}</span>,
      <span className="pl-1">{props.y.toPrecision(4)}</span>)
    </>
  );
}

interface ShapeProps {
  c: Canvas2DComponent;
  resize: (x: number) => number;
  setCursor: (cursor: "default" | "pointer") => void;
}
function Shape(props: ShapeProps) {
  const { c, resize } = props;
  const { addResult } = useFuncResult();
  const mv = (pos: Point) =>
    new Transform(multiply(c.origin.tfMatrix, new Transform(pos.pos).tfMatrix));
  const [hovering, setHovering] = useState<boolean>(false);
  const onMouseEnter = () => {
    if (c.onClick) {
      props.setCursor("pointer");
      setHovering(true);
    }
  };
  const onMouseLeave = () => {
    if (c.onClick) {
      props.setCursor("default");
      setHovering(false);
    }
  };
  const onClick = () => c.onClick && addResult(c.onClick.runAsync());
  const konvaProps = {
    stroke: c.color ? colorName[c.color] : "black",
    fill: hovering
      ? colorNameHover[c.color || viewColor.white]
      : c.fillColor
      ? colorName[c.fillColor]
      : undefined,
    strokeWidth: resize(c.strokeWidth),
    listening: !!c.onClick,
    onClick: onClick,
    onTap: onClick,
    onMouseEnter: onMouseEnter,
    onPointerLeave: onMouseLeave,
    onTouchStart: onMouseEnter,
    onTouchEnd: onMouseLeave,
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
