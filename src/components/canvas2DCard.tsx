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
import {IconButton} from "./button";
import {iconFillColor} from "./sideMenu";
import {Move, Home, Help} from "@icon-park/react";
import { CaptionBox } from "./caption";

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
  const [cursorIsPointer, setCursorIsPointer] = useState<boolean>(false);
  const [moveEnabled, setMoveEnabled] = useState<boolean>(false);

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

  const [pointerPos, setPointerPos] = useState<null | { x: number; y: number }>(
    null
  );
  const [movePos, setMovePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [worldScale, setWorldScale] = useState<number>(1);
  // const moveSpeed = 1 / worldScale / ratio;
  // const rotateSpeed = 0.01;
  // const scrollSpeed = 0.002 * worldScale;
  const scaleRate = 1.001;
  const pointers = useRef<PointerEvent[]>([]);
  const prevPointerDistance = useRef<number | null>(null);

  // canvas2d座標系からdom座標系へ変換 (拡大縮小のみ)
  const resize = (x: number, scale = worldScale) => ratio * scale * x;
  // dom座標系でのcanvasの幅と高さ
  const canvasWidth = ratio * (props.canvas.width || 1);
  const canvasHeight = ratio * (props.canvas.height || 1);
  // 座標変換 (canvas->dom)
  const transformPosX = (x: number) =>
    resize(x + movePos.x) + (divWidth - canvasWidth) / 2;
  const transformPosY = (y: number) =>
    resize(y + movePos.y) + (divHeight - canvasHeight) / 2;
  // dom->canvas
  const getPosX = (x: number, scale = worldScale) => 
    (x - (divWidth - canvasWidth) / 2) / ratio / scale - movePos.x;
  const getPosY = (y: number, scale = worldScale) => 
    (y - (divHeight - canvasHeight) / 2) / ratio / scale - movePos.y;

  const zoomAt = (domX: number, domY: number, newScale: number) => {
    const currentX = getPosX(domX);
    const currentY = getPosY(domY);
    const afterX = getPosX(domX, newScale);
    const afterY = getPosY(domY, newScale);
    setMovePos({
      x: movePos.x + (afterX - currentX),
      y: movePos.y + (afterY - currentY),
    });
    setWorldScale(newScale);
  }
  const onPointerDown = (e: PointerEvent) => {
    if (
      pointers.current.filter((p) => p.pointerId === e.pointerId).length === 0
    ) {
      pointers.current.push(e);
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    pointers.current = pointers.current.filter(
      (p) => p.pointerId !== e.pointerId
    );
    prevPointerDistance.current = null;
  };
  const onPointerMove = (e: PointerEvent) => {
    const divPos = e.currentTarget.getBoundingClientRect();
    if (pointers.current.length <= 1) {
      setPointerPos({
        x: getPosX(e.clientX - divPos.left),
        y: getPosY(e.clientY - divPos.top),
      });
      if (moveEnabled && (e.buttons & 1 || e.buttons & 4)) {
        setMovePos({
          x: movePos.x + e.movementX / ratio / worldScale,
          y: movePos.y + e.movementY / ratio / worldScale,
        });
      }
    } else if (moveEnabled && pointers.current.length === 2) {
      pointers.current = pointers.current.map((p) => p.pointerId === e.pointerId ? e : p);
      const newDiff = {
        x: pointers.current[0].clientX - pointers.current[1].clientX,
        y: pointers.current[0].clientY - pointers.current[1].clientY,
      };
      const newDist = Math.sqrt(newDiff.x * newDiff.x + newDiff.y * newDiff.y);
      let distChange = 1;
      if (prevPointerDistance.current !== null) {
        distChange = newDist / prevPointerDistance.current;
      }
      prevPointerDistance.current = newDist;
      zoomAt(
        (pointers.current[0].clientX + pointers.current[1].clientX) / 2 - divPos.left,
        (pointers.current[0].clientY + pointers.current[1].clientY) / 2 - divPos.top,
        worldScale * distChange ** 1.2
      );
    }
  };
  const onWheel = (e: PointerEvent) => {
    if(moveEnabled){
      const divPos = e.currentTarget.getBoundingClientRect();
      zoomAt(
        e.clientX - divPos.left,
        e.clientY - divPos.top,
        worldScale * scaleRate ** -e.deltaY
      );
    }
  };

  return (
    <Card title={`${props.canvas.member.name}:${props.canvas.name}`}>
      <div
        className="h-full w-full flex flex-col"
        style={{ touchAction: moveEnabled ? "none" : "auto" }}
      >
        <div
          ref={divRef}
          className="flex-1 max-h-full w-full"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerEnter={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <Stage
            width={divWidth}
            height={divHeight}
            style={{
              width: divWidth,
              height: divHeight,
              cursor: cursorIsPointer ? "pointer" : moveEnabled ? "grab" : "default",
            }}
            className="m-auto"
          >
            <Layer>
              {props.canvas.get().map((c, ci) => (
                <Shape
                  key={ci}
                  c={c}
                  resize={resize}
                  transformPosX={transformPosX}
                  transformPosY={transformPosY}
                  setCursorIsPointer={(p: boolean) => setCursorIsPointer(p)}
                  moveEnabled={moveEnabled}
                />
              ))}
            </Layer>
          </Stage>
        </div>
        <div className="flex-none h-8 text-xs flex items-center ">
          <div className="flex-1">
          {pointerPos !== null && <CoordText {...pointerPos} />}
          </div>
          <div className="flex-none text-lg relative">
            <IconButton
              onClick={() => setMoveEnabled(!moveEnabled)}
              caption="Canvasの移動・ズーム オン/オフ"
            >
              {moveEnabled ? 
                <Move theme="two-tone" fill={iconFillColor} />
                :
                <Move />
              }
            </IconButton>
            <IconButton
              onClick={() => {
                setMovePos({x:0, y:0});
                setWorldScale(1);
              }}
              caption="初期位置に戻す"
            >
              <Home />
            </IconButton>
            <IconButton className="mr-4 peer">
              <Help />
            </IconButton>
            <CaptionBox className={
              "absolute bottom-full right-4 " +
              "hidden peer-hover:inline-block peer-focus:inline-block "
            }>
              <p>移動・ズームがオンのとき、</p>
              <p>(マウス)ドラッグ / (タッチ)スライド で移動、</p>
              <p>(マウス)スクロール / (タッチ)2本指操作 で</p>
              <p>拡大縮小できます。</p>
              <p>要素のクリックは移動・ズームがオフの間のみ</p>
              <p>反応します。</p>
            </CaptionBox>
          </div>
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
  transformPosX: (x: number) => number;
  transformPosY: (x: number) => number;
  setCursorIsPointer: (isPointer: boolean) => void;
  moveEnabled: boolean;
}
function Shape(props: ShapeProps) {
  const { c, resize, transformPosX, transformPosY, moveEnabled } = props;
  const { addResult } = useFuncResult();
  const mv = (pos: Point) =>
    new Transform(multiply(c.origin.tfMatrix, new Transform(pos.pos).tfMatrix));
  const [hovering, setHovering] = useState<boolean>(false);
  const onMouseEnter = () => {
    if (c.onClick && !moveEnabled) {
      props.setCursorIsPointer(true);
      setHovering(true);
    }
  };
  const onMouseLeave = () => {
    if (c.onClick && !moveEnabled) {
      props.setCursorIsPointer(false);
      setHovering(false);
    }
  };
  const onClick = () => c.onClick && !moveEnabled && addResult(c.onClick.runAsync());
  const konvaProps = {
    stroke: c.color ? colorName[c.color] : "black",
    fill: hovering
      ? colorNameHover[c.color || viewColor.white]
      : c.fillColor
      ? colorName[c.fillColor]
      : undefined,
    strokeWidth: resize(c.strokeWidth),
    listening: !!c.onClick && !moveEnabled,
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
            transformPosX(mv(c.geometry.asLine.begin).pos[0]),
            transformPosY(mv(c.geometry.asLine.begin).pos[1]),
            transformPosX(mv(c.geometry.asLine.end).pos[0]),
            transformPosY(mv(c.geometry.asLine.end).pos[1]),
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
                transformPosX(mv(new Point(xy)).pos[0]),
                transformPosY(mv(new Point(xy)).pos[1]),
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
              prev.concat([
                transformPosX(mv(xy).pos[0]),
                transformPosY(mv(xy).pos[1]),
              ]),
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
          x={transformPosX(mv(c.geometry.asCircle.origin).pos[0])}
          y={transformPosY(mv(c.geometry.asCircle.origin).pos[1])}
          radius={resize(c.geometry.asCircle.radius)}
          {...konvaProps}
        />
      );
    default:
      return null;
  }
}
