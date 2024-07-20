import { Card } from "./card";
import { Value } from "webcface";
import {
  useState,
  useEffect,
  useRef,
  PointerEvent,
  WheelEvent,
  HTMLProps,
} from "react";
import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";
import ReactSlider from "react-slider";
import { format, addMilliseconds, setMilliseconds } from "date-fns";
import { IconButton } from "./button";
import { Help, Home, Move } from "@icon-park/react";
import { iconFillColor } from "./sideMenu";
import { CaptionBox } from "./caption";

interface Props {
  value: Value;
}

const numPoints = 5000;

export function ValueCard(props: Props) {
  const canvasMain = useRef<HTMLCanvasElement>(null);
  const canvasDiv = useRef<HTMLDivElement>(null);
  // 過去の全データ
  const data = useRef<number[]>([]);
  // 表示する時刻
  const currentPos = useRef<number>(0);
  // 最新のデータに追従するかどうか
  // isLatestのときcurrentXだけでなくMinY,MaxYも自動更新される
  const isLatest = useRef<boolean>(true);
  const currentMinY = useRef<number>(-1);
  const currentMaxY = useRef<number>(1);
  // 全データのmin,max
  const dataMinY = useRef<number | null>(null);
  const dataMaxY = useRef<number | null>(null);
  // 表示用
  const [displayMinY, setDisplayMinY] = useState<number>(-1);
  const [displayMaxY, setDisplayMaxY] = useState<number>(1);
  const [displayPos, setDisplayPos] = useState<number>(0); // currentPosと同じ値
  // データ数 (renderPlot内でセットされる)
  const [maxPos, setMaxPos] = useState<number>(0);
  // valueChange時に更新される
  const lastUpdate = useRef<Date>(new Date());
  // 最初のデータの時刻
  const [startTime, setStartTime] = useState<Date>(new Date());

  // currentPos,displayPosをセット
  const setCurrentXPos = (x: number, max?: number) => {
    if (max) {
      setMaxPos(max);
    } else {
      max = maxPos;
    }
    x = Math.max(0, Math.min(max, Math.round(x)));
    currentPos.current = x;
    setDisplayPos(x);
  };
  const setRangeY = (minY: number, maxY: number) => {
    currentMaxY.current = maxY;
    currentMinY.current = minY;
    setDisplayMaxY(maxY);
    setDisplayMinY(minY);
  };

  useEffect(() => {
    const onValueChange = () => {
      const val = props.value.tryGet();
      if (val != null) {
        const now = props.value.time();
        if (now.getTime() < lastUpdate.current.getTime()) {
          console.error(`invalid time ${now.toLocaleString()}`);
        } else {
          const timeDiff = now.getTime() - lastUpdate.current.getTime();
          lastUpdate.current = now;
          if (data.current.length === 0) {
            setStartTime(now);
          }
          for (let t = 0; t < timeDiff; t++) {
            data.current.push(val);
            if (dataMinY.current === null || dataMinY.current > val) {
              dataMinY.current = val;
            }
            if (dataMaxY.current === null || dataMaxY.current < val) {
              dataMaxY.current = val;
            }
          }
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
      numPoints
    );
    line.arrangeX();

    if (canvasMain.current) {
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

        let pos = currentPos.current;
        if (line.numPoints > data.current.length) {
          pos = data.current.length - line.numPoints;
        } else {
          const max = data.current.length - line.numPoints;
          setMaxPos(max);
          if (isLatest.current) {
            pos = max;
            setCurrentXPos(max, max);
          }
        }
        for (let i = 0; i < line.numPoints; i++) {
          if (pos + i >= 0) {
            const val = data.current[pos + i];
            line.setY(i, val);
          }
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
        const midY = (currentMaxY.current + currentMinY.current) / 2;
        line.offsetY = -midY / (currentMaxY.current - midY);
        line.scaleY = 1 / (currentMaxY.current - midY);

        id = requestAnimationFrame(renderPlot);
        webglp.update();
      };
      id = requestAnimationFrame(renderPlot);

      return () => {
        renderPlot = () => undefined;
        cancelAnimationFrame(id);
      };
    }
  }, []);

  // カーソルを乗せた位置の値を表示する用
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [cursorValue, setCursorValue] = useState<number | null>(null);
  useEffect(() => {
    if (cursorX != null && canvasMain.current != null) {
      let pos = currentPos.current;
      if (numPoints > data.current.length) {
        pos = data.current.length - numPoints;
      }
      const cursorPos = pos + (cursorX / canvasMain.current.width) * numPoints;
      if (cursorPos >= 0) {
        const val = data.current[Math.round(cursorPos)];
        setCursorValue(val);
        const y =
          ((val - displayMinY) / (displayMaxY - displayMinY)) *
          canvasMain.current.height;
        setCursorY(y);
      }
    }
  }, [cursorX, displayPos, displayMinY, displayMaxY]);

  // グリッド
  let yTick = Math.pow(
    10,
    Math.floor(Math.log10(Math.max(1, displayMaxY - displayMinY)))
  );
  if ((displayMaxY - displayMinY) / yTick <= 2) {
    yTick /= 5;
  } else if ((displayMaxY - displayMinY) / yTick <= 5) {
    yTick /= 2;
  }
  const displayMaxX = addMilliseconds(
    startTime,
    maxPos === 0 ? data.current.length : displayPos + numPoints
  );

  const scaleRate = 1.001;
  const pointers = useRef<PointerEvent[]>([]);
  const prevPointerDistance = useRef<number | null>(null);

  const zoomAt = (domY: number, scaleDiff: number) => {
    isLatest.current = false;
    const valY =
      currentMaxY.current -
      (domY / (canvasMain.current?.height || 1)) *
        (currentMaxY.current - currentMinY.current);
    setRangeY(
      currentMinY.current - (valY - currentMinY.current) * (scaleDiff - 1),
      currentMaxY.current + (currentMaxY.current - valY) * (scaleDiff - 1)
    );
  };
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
      if (!isLatest.current && (e.buttons & 1 || e.buttons & 4)) {
        const yDiff =
          (e.movementY / (canvasMain.current?.height || 1)) *
          (displayMaxY - displayMinY);
        isLatest.current = false;
        setRangeY(currentMinY.current + yDiff, currentMaxY.current + yDiff);
        setCurrentXPos(
          currentPos.current -
            (e.movementX / (canvasMain.current?.width || 1)) * numPoints
        );
      }
    } else if (!isLatest.current && pointers.current.length === 2) {
      pointers.current = pointers.current.map((p) =>
        p.pointerId === e.pointerId ? e : p
      );
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
        (pointers.current[0].clientY + pointers.current[1].clientY) / 2 -
          divPos.top,
        distChange ** 1.2
      );
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (!isLatest.current) {
      const divPos = e.currentTarget.getBoundingClientRect();
      zoomAt(e.clientY - divPos.top, scaleRate ** -e.deltaY);
    }
  };

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
                  Math.floor(displayMaxY / yTick) -
                    Math.ceil(displayMinY / yTick) +
                    1,
                  0
                )
              ).keys(),
            ]
              .map((_, i) => (Math.ceil(displayMinY / yTick) + i) * yTick)
              .map((y, i) => (
                <div
                  key={i}
                  className="absolute w-full h-auto left-0 border-b border-gray-300 text-gray-500"
                  style={{
                    bottom:
                      ((y - displayMinY) / (displayMaxY - displayMinY)) *
                      (canvasMain.current?.height || 0),
                  }}
                >
                  {y}
                </div>
              ))}
            {[...new Array(4).keys()]
              .map(
                (_, i) => setMilliseconds(displayMaxX, 0).getTime() - i * 1000
              )
              .map((x, i) => (
                <div
                  key={i}
                  className="absolute w-auto h-full bottom-0 border-r border-gray-300 text-gray-500"
                  style={{
                    right:
                      ((displayMaxX.getTime() - x) / numPoints) *
                      (canvasMain.current?.width || 0),
                  }}
                >
                  <span className="absolute bottom-0 right-0">
                    {format(x, ":ss")}
                  </span>
                </div>
              ))}
            <div className="w-full h-full relative" ref={canvasDiv}>
              <canvas
                className=""
                onPointerMove={(e) => {
                  if (e.currentTarget) {
                    const targetRect = e.currentTarget.getBoundingClientRect();
                    setCursorX(e.clientX - targetRect.left);
                  }
                  onPointerMove(e);
                }}
                onPointerLeave={(e) => {
                  setCursorX(null);
                  onPointerUp(e);
                }}
                onPointerDown={onPointerDown}
                onPointerEnter={onPointerMove}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
                ref={canvasMain}
              />
              <GraphValue
                x={cursorX}
                y={cursorY}
                value={cursorValue}
                time={
                  cursorX != null
                    ? addMilliseconds(
                        displayMaxX,
                        -numPoints +
                          (cursorX / (canvasMain.current?.width || 1)) *
                            numPoints
                      )
                    : null
                }
              />
            </div>
          </div>
        </div>
        <div className="flex-none flex items-center space-x-1 text-xs">
          <span>Time:</span>
          <ReactSlider
            className="w-full h-4"
            renderTrack={SliderTrack}
            renderThumb={SliderThumb}
            min={maxPos === 0 ? -1 : 0}
            max={maxPos}
            value={displayPos}
            disabled={maxPos === 0}
            onChange={(value) => {
              // maxPos=0のときスクロール不可、minを-1にすることで右端にする
              if (maxPos > 0) {
                setCurrentXPos(value);
                isLatest.current = maxPos === value;
              }
            }}
          />
          <span>
            {format(
              addMilliseconds(
                startTime,
                maxPos === 0 ? data.current.length : maxPos + numPoints
              ),
              "H:mm:ss"
            )}
          </span>
        </div>
        {/*        <div className="flex-none flex items-center px-2 space-x-1 text-sm">
          <input
            type="checkbox"
            id={`follow-${props.value.member.name}:${props.value.name}-value`}
            checked={isLatest.current}
            onChange={(e) => {
              if (e.target.checked) {
                setCurrentXPos(maxPos);
                isLatest.current = true;
              } else {
                if (maxPos === currentPos.current && maxPos > 0) {
                  setCurrentXPos(maxPos - 1);
                }
                if (currentPos.current < maxPos) {
                  isLatest.current = false;
                }
              }
            }}
          />
          <label
            htmlFor={`follow-${props.value.member.name}:${props.value.name}-value`}
          >
            Follow Latest Data
          </label>
        </div>*/}
        <div className="flex-none h-8 text-xs flex items-center ">
          <div className="flex-1"></div>
          <div className="flex-none text-lg relative">
            <IconButton
              onClick={() => {
                if (maxPos === currentPos.current && maxPos > 0) {
                  setCurrentXPos(maxPos - 1);
                }
                if (currentPos.current < maxPos) {
                  isLatest.current = false;
                }
              }}
              caption="グラフの移動・ズーム オン/オフ"
            >
              {!isLatest.current ? (
                <Move theme="two-tone" fill={iconFillColor} />
              ) : (
                <Move />
              )}
            </IconButton>
            <IconButton
              onClick={() => {
                setCurrentXPos(maxPos);
                isLatest.current = true;
              }}
              caption="初期位置に戻す"
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
              <p>(マウス)スクロール / (タッチ)2本指操作 で</p>
              <p>拡大縮小できます。</p>
            </CaptionBox>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SliderTrack(
  props: HTMLProps<HTMLDivElement>
  /*state: { index: number; value: number }*/
) {
  return (
    <div
      {...props}
      className={
        props.className + " absolute inset-0 my-1.5 bg-neutral-300 rounded-full"
      }
    />
  );
}
function SliderThumb(
  props: HTMLProps<HTMLDivElement>
  /*state: { index: number; value: number; valueNow: number }*/
) {
  return (
    <div
      {...props}
      className={
        props.className +
        " absolute h-full aspect-square rounded-full " +
        "bg-green-600 hover:bg-green-500 active:bg-green-500 " +
        "cursor-grab active:cursor-grabbing"
      }
    />
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
