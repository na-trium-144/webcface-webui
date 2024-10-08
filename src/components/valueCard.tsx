import { Card } from "./card";
import { Value } from "webcface";
import {
  useState,
  useEffect,
  useRef,
  PointerEvent as ReactPointerEvent,
} from "react";
import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";
import { format } from "date-fns";
import { IconButton } from "./button";
import { Help, Home, Move } from "@icon-park/react";
import { iconFillColor } from "./sideMenu";
import { CaptionBox } from "./caption";
import { useForceUpdate } from "../libs/forceUpdate";
import { useLayoutChange } from "./layoutChangeProvider";
import { Slider } from "./slider";

interface Props {
  value: Value;
}

const maxXRange = 5000; // ms

export function ValueCard(props: Props) {
  const { layoutChanging } = useLayoutChange();
  const canvasMain = useRef<HTMLCanvasElement>(null);
  const canvasDiv = useRef<HTMLDivElement>(null);
  const hasUpdate = useRef<boolean>(true);
  const update = useForceUpdate();
  // 過去の全データ
  const data = useRef<{ x: Date; y: number }[]>([]);
  // 表示する時刻 (グラフの左端の時刻)
  const minX = useRef<number | null>(null);
  const maxX = useRef<number | null>(null);
  // 最新のデータに追従するかどうか
  // isLatestのときcurrentXだけでなくMinY,MaxYも自動更新される
  const isLatest = useRef<boolean>(true);
  const minY = useRef<number>(-1);
  const maxY = useRef<number>(1);
  // 全データのmin,max
  const dataMinX = () =>
    data.current.length > 0 ? data.current[0].x.getTime() : null;
  const dataMaxX = () =>
    data.current.length > 0
      ? data.current[data.current.length - 1].x.getTime()
      : null;
  const dataMinY = useRef<number | null>(null);
  const dataMaxY = useRef<number | null>(null);
  const hasSufficientData = () =>
    data.current.length && dataMaxX()! - dataMinX()! >= maxXRange;

  // 値→DOM
  const getPosX = (x: number) =>
    minX.current && maxX.current && canvasMain.current
      ? ((x - minX.current) / (maxX.current - minX.current)) *
        canvasMain.current.width
      : 0;
  const getPosY = (y: number) =>
    canvasMain.current
      ? ((y - minY.current) / (maxY.current - minY.current)) *
        canvasMain.current.height
      : 0;
  // DOM→値
  const getValX = (x: number) =>
    minX.current && maxX.current && canvasMain.current
      ? minX.current +
        (x / canvasMain.current.width) * (maxX.current - minX.current)
      : null;
  const getValY = (y: number) =>
    canvasMain.current
      ? maxY.current -
        (y / canvasMain.current.height) * (maxY.current - minY.current)
      : minY.current;

  const setRangeX = (newMinX: number, newMaxX: number) => {
    if (minX.current !== newMinX || maxX.current !== newMaxX) {
      hasUpdate.current = true;
    }
    minX.current = newMinX;
    maxX.current = newMaxX;
  };
  const setRangeY = (newMinY: number, newMaxY: number) => {
    if (newMaxY - newMinY < 1) {
      const midY = (newMaxY + newMinY) / 2;
      newMaxY = midY + 0.5;
      newMinY = midY - 0.5;
    }
    if (minY.current !== newMinY || maxY.current !== newMaxY) {
      hasUpdate.current = true;
    }
    maxY.current = newMaxY;
    minY.current = newMinY;
  };

  useEffect(() => {
    if (!layoutChanging) {
      const i = setInterval(() => {
        if (hasUpdate.current) {
          update();
          hasUpdate.current = false;
        }
      }, 50);
      return () => clearInterval(i);
    }
  }, [layoutChanging, update]);

  // dataの追加
  useEffect(() => {
    const onValueChange = () => {
      const val = props.value.tryGet();
      const now = props.value.time(); // todo: 時刻0が返ってくるのはなぜ?
      if (val != null && now.getTime() !== 0) {
        if (data.current.length && now.getTime() < dataMaxX()!) {
          console.error(`Invalid time ${now.toLocaleString()}`);
        } else if (data.current.length && now.getTime() == dataMaxX()!) {
          // todo: 1ms以下の間隔でデータが来たら描画できない (ので今は弾いている)
          // というか時刻の分解能が1msしかない
          console.error(`Ignoring more than 1 data point per 1ms.`);
        } else {
          data.current.push({ x: now, y: val });
          if (dataMinY.current === null || dataMinY.current > val) {
            dataMinY.current = val;
          }
          if (dataMaxY.current === null || dataMaxY.current < val) {
            dataMaxY.current = val;
          }
          hasUpdate.current = true; // 右下の時刻表示のため
        }
      }
    };
    props.value.tryGet();
    props.value.member.onSync.on(onValueChange);
    return () => props.value.member.onSync.off(onValueChange);
  }, [props.value]);

  useEffect(() => {
    let webglp: WebglPlot | null = null;
    const line: WebglLine = new WebglLine(
      new ColorRGBA(0, 0.6, 0, 1),
      maxXRange * 2 // 階段状に描画するために2倍
    );
    line.arrangeX();

    if (canvasMain.current && !layoutChanging) {
      let id = 0;
      let renderPlot = () => {
        if (canvasMain.current == null || canvasDiv.current == null) {
          return;
        }
        if (
          webglp == null ||
          canvasMain.current.width != canvasDiv.current.clientWidth ||
          canvasMain.current.height !== canvasDiv.current.clientHeight
        ) {
          canvasMain.current.width = canvasDiv.current.clientWidth;
          canvasMain.current.height = canvasDiv.current.clientHeight;

          webglp = new WebglPlot(canvasMain.current);
          webglp.addLine(line);
        }

        if (data.current.length) {
          if (dataMaxX()! - dataMinX()! < maxXRange) {
            setRangeX(dataMaxX()! - maxXRange, dataMaxX()!);
          } else {
            if (isLatest.current) {
              setRangeX(dataMaxX()! - maxXRange, dataMaxX()!);
            }
          }
          const minI =
            data.current.findIndex(({ x }) => x.getTime() > minX.current!) - 1;
          let x = 0;
          let y = 0;
          let prevY: number | null = null;
          for (let i = 0; i < line.numPoints; i++) {
            // 最大numPoints個の点しか描画できない
            if (minI + i >= 0 && minI + i < data.current.length) {
              // x: -1 ~ 1
              x =
                -1 +
                ((data.current[minI + i].x.getTime() - minX.current!) /
                  (maxX.current! - minX.current!)) *
                  2;
              y = data.current[minI + i].y;
            }
            if (!prevY) {
              prevY = y;
            }
            line.setX(i * 2, x);
            line.setY(i * 2, prevY);
            line.setX(i * 2 + 1, x);
            line.setY(i * 2 + 1, y);
            prevY = y;
          }
          if (
            isLatest.current &&
            dataMaxY.current != null &&
            dataMinY.current != null
          ) {
            let maxY = dataMaxY.current;
            let minY = dataMinY.current;
            const midY = (maxY + minY) / 2;
            if (maxY - minY < 1) {
              maxY = midY + 0.5;
              minY = midY - 0.5;
            }
            setRangeY(minY, maxY);
          }
          const midY = (maxY.current + minY.current) / 2;
          line.offsetY = -midY / (maxY.current - midY);
          line.scaleY = 1 / (maxY.current - midY);
        }
        id = requestAnimationFrame(renderPlot);
        webglp.update();
      };
      id = requestAnimationFrame(renderPlot);

      return () => {
        renderPlot = () => undefined;
        cancelAnimationFrame(id);
      };
    }
  }, [layoutChanging]);

  // カーソルを乗せた位置の値を表示する用
  const [cursorPosXRaw, setCursorPosXRaw] = useState<number | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [cursorI, setCursorI] = useState<number | null>(null);
  useEffect(() => {
    if (
      cursorPosXRaw != null &&
      canvasMain.current != null &&
      data.current.length > 0
    ) {
      const cursorXRaw = getValX(cursorPosXRaw);
      const nearestI = data.current.reduce(
        (prevI: number, { x }, i) =>
          Math.abs(x.getTime() - cursorXRaw!) <
          Math.abs(data.current[prevI].x.getTime() - cursorXRaw!)
            ? i
            : prevI,
        0
      );
      setCursorX(getPosX(data.current[nearestI].x.getTime()));
      setCursorY(getPosY(data.current[nearestI].y));
      setCursorI(nearestI);
    } else {
      setCursorX(null);
      setCursorY(null);
      setCursorI(null);
    }
  }, [cursorPosXRaw]);

  // グリッド
  let yTick = Math.pow(10, Math.floor(Math.log10(maxY.current - minY.current)));
  if ((maxY.current - minY.current) / yTick <= 2) {
    yTick /= 5;
  } else if ((maxY.current - minY.current) / yTick <= 5) {
    yTick /= 2;
  }
  let xTick = 1000;
  if (maxX.current && minX.current) {
    xTick = Math.pow(10, Math.floor(Math.log10(maxX.current - minX.current)));
    if ((maxX.current - minX.current) / xTick <= 1) {
      xTick /= 5;
    } else if ((maxX.current - minX.current) / xTick <= 2.5) {
      xTick /= 2;
    }
  }

  const scaleRate = 1.001;
  const pointers = useRef<ReactPointerEvent[]>([]);
  const prevPointerDistanceX = useRef<number | null>(null);
  const prevPointerDistanceY = useRef<number | null>(null);

  const zoomXAt = (domX: number, scaleDiff: number) => {
    if (maxX.current && minX.current && canvasMain.current) {
      isLatest.current = false;
      if ((maxX.current - minX.current) / scaleDiff > maxXRange) {
        scaleDiff = (maxX.current - minX.current) / maxXRange;
      }
      if ((maxX.current - minX.current) / scaleDiff <= 3) {
        scaleDiff = (maxX.current - minX.current) / 3;
      }
      setRangeX(
        minX.current + (getValX(domX)! - minX.current) * (scaleDiff - 1),
        maxX.current - (maxX.current - getValX(domX)!) * (scaleDiff - 1)
      );
    }
  };
  const zoomYAt = (domY: number, scaleDiff: number) => {
    isLatest.current = false;
    setRangeY(
      minY.current + (getValY(domY) - minY.current) * (scaleDiff - 1),
      maxY.current - (maxY.current - getValY(domY)) * (scaleDiff - 1)
    );
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    if (
      pointers.current.filter((p) => p.pointerId === e.pointerId).length === 0
    ) {
      pointers.current.push(e);
    }
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current = pointers.current.filter(
      (p) => p.pointerId !== e.pointerId
    );
    prevPointerDistanceX.current = null;
    prevPointerDistanceY.current = null;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const divPos = e.currentTarget.getBoundingClientRect();
    if (
      pointers.current.length <= 1 &&
      canvasMain.current &&
      maxX.current &&
      minX.current
    ) {
      if (!isLatest.current && (e.buttons & 1 || e.buttons & 4)) {
        const yDiff =
          (e.movementY / (canvasMain.current.height || 1)) *
          (maxY.current - minY.current);
        const xDiff =
          (e.movementX / (canvasMain.current.width || 1)) *
          (maxX.current - minX.current);
        isLatest.current = false;
        setRangeY(minY.current + yDiff, maxY.current + yDiff);
        setRangeX(minX.current - xDiff, maxX.current - xDiff);
      }
    } else if (!isLatest.current && pointers.current.length === 2) {
      pointers.current = pointers.current.map((p) =>
        p.pointerId === e.pointerId ? e : p
      );
      const newDiff = {
        x: pointers.current[0].clientX - pointers.current[1].clientX,
        y: pointers.current[0].clientY - pointers.current[1].clientY,
      };
      let distChangeY = 1;
      let distChangeX = 1;
      if (prevPointerDistanceY.current !== null) {
        distChangeY = newDiff.y / prevPointerDistanceY.current;
      }
      if (prevPointerDistanceX.current !== null) {
        distChangeX = newDiff.x / prevPointerDistanceX.current;
      }
      prevPointerDistanceY.current = newDiff.y;
      prevPointerDistanceX.current = newDiff.x;
      zoomYAt(
        (pointers.current[0].clientY + pointers.current[1].clientY) / 2 -
          divPos.top,
        distChangeY ** 1.2
      );
      zoomXAt(
        (pointers.current[0].clientX + pointers.current[1].clientX) / 2 -
          divPos.left,
        distChangeX ** 1.2
      );
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (!isLatest.current && canvasMain.current) {
      const divPos = canvasMain.current.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        zoomXAt(e.clientX - divPos.left, scaleRate ** e.deltaY);
      } else {
        zoomYAt(e.clientY - divPos.top, scaleRate ** e.deltaY);
      }
      e.preventDefault();
    }
  };
  useEffect(() => {
    const canvasMainCurrent = canvasMain.current;
    if (canvasMainCurrent) {
      canvasMainCurrent.addEventListener("wheel", onWheel, {
        passive: false,
      });
      return () => canvasMainCurrent.removeEventListener("wheel", onWheel);
    }
  });

  return (
    <Card title={`${props.value.member.name}:${props.value.name}`}>
      <div className="flex flex-col h-full">
        <div className="flex-1 w-full min-h-0 flex flex-row text-xs">
          <div className="flex-1 h-full min-w-0 pt-2 relative select-none">
            {/*
            <span className="absolute top-2 left-0">{displayMaxY}</span>
            <span className="absolute left-0">{displayMinY}</span>
            */}
            {[
              ...new Array(
                Math.max(
                  Math.floor(maxY.current / yTick) -
                    Math.ceil(minY.current / yTick) +
                    1,
                  0
                )
              ).keys(),
            ]
              .map((_, i) => (Math.ceil(minY.current / yTick) + i) * yTick)
              .map((y, i) => (
                <div
                  key={i}
                  className="absolute w-full h-auto left-0 border-b border-gray-300 text-gray-500"
                  style={{ bottom: getPosY(y) }}
                >
                  {y}
                </div>
              ))}
            {maxX.current &&
              minX.current &&
              [
                ...new Array(
                  Math.max(
                    Math.floor(maxX.current / xTick) -
                      Math.ceil(minX.current / xTick),
                    0
                  )
                ).keys(),
              ]
                .map((_, i) => (Math.floor(maxX.current! / xTick) - i) * xTick)
                .map((x, i) => (
                  <div
                    key={i}
                    className="absolute w-auto h-full bottom-0 border-r border-gray-300 text-gray-500"
                    style={{
                      right: canvasMain.current!.width - getPosX(x),
                    }}
                  >
                    <span className="absolute bottom-0 right-0">
                      {xTick >= 1000
                        ? format(x, ":ss")
                        : xTick >= 100
                        ? format(x, ":ss.S")
                        : xTick >= 10
                        ? format(x, ":ss.SS")
                        : format(x, ":ss.SSS")}
                    </span>
                  </div>
                ))}
            <div className="w-full h-full relative" ref={canvasDiv}>
              <canvas
                className=""
                onPointerMove={(e) => {
                  if (e.currentTarget) {
                    const targetRect = e.currentTarget.getBoundingClientRect();
                    setCursorPosXRaw(e.clientX - targetRect.left);
                  }
                  onPointerMove(e);
                }}
                onPointerLeave={(e) => {
                  setCursorPosXRaw(null);
                  onPointerUp(e);
                }}
                onPointerDown={onPointerDown}
                onPointerEnter={onPointerMove}
                onPointerUp={onPointerUp}
                style={{
                  cursor: !isLatest.current ? "grab" : "default",
                  touchAction: !isLatest.current ? "none" : "auto",
                }}
                ref={canvasMain}
              />
              <GraphValue
                x={cursorX}
                y={cursorY}
                value={cursorI !== null ? data.current[cursorI].y : null}
                time={cursorI !== null ? data.current[cursorI].x : null}
              />
            </div>
          </div>
        </div>
        <div className="flex-none flex items-center space-x-1 text-xs ">
          <span>Time:</span>
          <Slider
            className="w-full h-5"
            min={!hasSufficientData() ? -1 : 0}
            max={
              !hasSufficientData() || !maxX.current || !minX.current
                ? 0
                : dataMaxX()! - dataMinX()! - (maxX.current - minX.current)
            }
            value={
              !hasSufficientData() || !minX.current
                ? 0
                : minX.current - dataMinX()!
            }
            disabled={!hasSufficientData()}
            onChange={(value) => {
              // maxPos=0のときスクロール不可、minを-1にすることで右端にする
              if (hasSufficientData() && maxX.current && minX.current) {
                const currentRange = maxX.current - minX.current;
                setRangeX(
                  dataMinX()! + value,
                  dataMinX()! + value + currentRange
                );
                isLatest.current = value === dataMaxX()! - currentRange;
              }
            }}
            step={1}
          />
          <span>{data.current.length && format(dataMaxX()!, "H:mm:ss")}</span>
        </div>
        <div className="flex-none h-8 text-xs flex items-center ">
          <div className="flex-1"></div>
          <div className="flex-none text-lg relative">
            <IconButton
              onClick={() => {
                isLatest.current = false;
              }}
              caption="グラフの移動・ズーム オン"
            >
              {!isLatest.current ? (
                <Move theme="two-tone" fill={iconFillColor} />
              ) : (
                <Move />
              )}
            </IconButton>
            <IconButton
              onClick={() => {
                isLatest.current = true;
              }}
              caption="初期位置に戻す(最新のデータを表示)"
            >
              <Home />
            </IconButton>
            <IconButton className="mr-4 peer" onClick={() => undefined}>
              <Help />
            </IconButton>
            <CaptionBox
              className={
                "absolute bottom-full right-4 " +
                "hidden peer-hover:inline-block peer-focus:inline-block "
              }
            >
              <p>移動・ズームがオンのとき、</p>
              <p>(マウス)ドラッグ / (タッチ)スライド で移動、</p>
              <p>(マウス)スクロール で Y 方向拡大縮小、</p>
              <p>Ctrl(Command⌘)+スクロール で X 方向拡大縮小、</p>
              <p>(タッチ)2本指操作 で拡大縮小できます。</p>
            </CaptionBox>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface GraphValueProps {
  x?: number | null;
  y?: number | null;
  value?: number | null;
  time?: Date | null;
}
function GraphValue(props: GraphValueProps) {
  if (
    props.x != null &&
    props.y != null &&
    props.value != null &&
    props.time != null
  ) {
    return (
      <div
        className={
          "absolute -translate-x-2/4 mb-1 text-center opacity-90 " +
          "inline-block pointer-events-none " +
          "bg-green-900 p-1 text-white text-xs rounded min-w-max "
        }
        style={{ left: props.x, bottom: props.y }}
      >
        <span
          className={
            "absolute top-full left-1/2 -translate-x-2/4 " +
            "border-4 border-transparent border-t-green-900"
          }
        />
        <div>{format(props.time, "H:mm:ss.SSS")}</div>
        <div>{props.value}</div>
      </div>
    );
  } else {
    return <></>;
  }
}
