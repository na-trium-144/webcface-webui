import { Card } from "./card";
import { Value } from "webcface";
import { useState, useEffect, useRef } from "react";
import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";
import ReactSlider from "react-slider";
import { format, addMilliseconds, setMilliseconds } from "date-fns";

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
  const isLatest = useRef<boolean>(true);
  // 表示用
  const [displayMinY, setDisplayMinY] = useState<number>(0);
  const [displayMaxY, setDisplayMaxY] = useState<number>(0);
  const [displayPos, setDisplayPos] = useState<number>(0); // currentPosと同じ値
  // データ数 (renderPlot内でセットされる)
  const [maxPos, setMaxPos] = useState<number>(0);
  // valueChange時に更新される
  const lastUpdate = useRef<Date>(new Date());
  // 最初のデータの時刻
  const [startTime, setStartTime] = useState<Date>(new Date());

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

        let maxY: number | null = null;
        let minY: number | null = null;
        let midY = 0;
        let pos = currentPos.current;
        if (line.numPoints > data.current.length) {
          pos = data.current.length - line.numPoints;
        } else {
          const max = data.current.length - line.numPoints;
          setMaxPos(max);
          if (isLatest.current) {
            pos = max;
            currentPos.current = max;
            setDisplayPos(max);
          }
        }
        for (let i = 0; i < line.numPoints; i++) {
          if (pos + i >= 0) {
            const val = data.current[pos + i];
            if (maxY == null || maxY < val) {
              maxY = val;
            }
            if (minY == null || minY > val) {
              minY = val;
            }
            if (maxY != null && minY != null) {
              midY = (maxY + minY) / 2;
              if (maxY === minY) {
                maxY += 1;
                minY -= 1;
              }
            }
            line.setY(i, val);
          }
        }
        if (maxY != null && minY != null) {
          line.offsetY = -midY / (maxY - midY);
          line.scaleY = 1 / (maxY - midY);
          setDisplayMinY(minY);
          setDisplayMaxY(maxY);
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
  }, []);

  const followValue = (f: boolean) => {
    if (f) {
      setDisplayPos(maxPos);
      currentPos.current = maxPos;
      isLatest.current = true;
    } else {
      if (maxPos === currentPos.current && maxPos > 0) {
        currentPos.current = maxPos - 1;
        setDisplayPos(maxPos - 1);
      }
      if (currentPos.current < maxPos) {
        isLatest.current = false;
      }
    }
  };

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

  let yTick = Math.pow(10, Math.floor(Math.log10(Math.max(1, displayMaxY - displayMinY))));
  if ((displayMaxY - displayMinY) / yTick <= 2) {
    yTick /= 5;
  } else if ((displayMaxY - displayMinY) / yTick <= 5) {
    yTick /= 2;
  }
  const displayMaxX = addMilliseconds(
    startTime,
    maxPos === 0 ? data.current.length : displayPos + numPoints
  );
  return (
    <Card title={`${props.value.member.name}:${props.value.name}`}>
      <div className="flex flex-col h-full">
        <div className="flex-1 w-full min-h-0 flex flex-row text-xs">
          <div className="flex-1 h-full min-w-0 pt-2 relative">
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
                      (displayMaxX.getTime() - x) / numPoints *
                      (canvasMain.current?.width || 0),
                  }}
                >
                  <span className="absolute bottom-0 right-0">{format(x, ":ss")}</span>
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
                }}
                onPointerLeave={() => setCursorX(null)}
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
                setDisplayPos(value);
                currentPos.current = value;
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
        <div className="flex-none flex items-center px-2 space-x-1 text-sm">
          <input
            type="checkbox"
            id={`follow-${props.value.member.name}:${props.value.name}-value`}
            checked={isLatest.current}
            onChange={(e) => followValue(e.target.checked)}
          />
          <label
            htmlFor={`follow-${props.value.member.name}:${props.value.name}-value`}
          >
            Follow Latest Data
          </label>
        </div>
      </div>
    </Card>
  );
}

function SliderTrack(props, state) {
  return (
    <div
      {...props}
      className={
        props.className + " absolute inset-0 my-1.5 bg-neutral-300 rounded-full"
      }
    />
  );
}
function SliderThumb(props, state) {
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
