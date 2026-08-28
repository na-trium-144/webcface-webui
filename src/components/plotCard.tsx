import { Plot, plotSeriesType } from "webcface";
import { Card } from "./card";
import { useEffect, useRef, useState } from "react";
import { useForceUpdate } from "../libs/forceUpdate";
import { useLayoutChange } from "./layoutChangeProvider";
import { ColorRGBA, WebglLine, WebglPlot } from "webgl-plot";

interface Props {
  plot: Plot;
}
interface Series {
  data: { x: number; y: number }[];
}
export function PlotCard(props: Props) {
  const { layoutChanging } = useLayoutChange();
  const canvasMain = useRef<HTMLCanvasElement>(null);
  const canvasDiv = useRef<HTMLDivElement>(null);

  const data = useRef<Series[]>([]);
  const minX = useRef<number | null>(null);
  const maxX = useRef<number | null>(null);
  const minY = useRef<number>(-1);
  const maxY = useRef<number>(1);

  useEffect(() => {
    const off: (() => void)[] = [];
    const onPlotChange = () => {
      const series = props.plot.get();
      for(let si = 0; si < series.length; si++){
        if(data.current.length <= si){
          data.current.push({data: []});
        }
        switch(series[si].type){
        case plotSeriesType.line2:{
          const onValueChange = () => {
            data.current[si].data = [];
            const x = series[si].values[0].getVec();
            const y = series[si].values[1].getVec();
            for(let i = 0; i < x.length && i < y.length; i++){
              data.current[si].data.push({x: x[i], y: y[i]});
            }
          };
          onValueChange();
          series[si].values[0].on(onValueChange);
          series[si].values[1].on(onValueChange);
          off.push(() => {
            series[si].values[0].off(onValueChange);
            series[si].values[1].off(onValueChange);
          });
          break;
        }
        }
      }
    };
    onPlotChange();
    props.plot.on(onPlotChange);
    off.push(() => props.plot.off(onPlotChange));
    return () => off.forEach((f) => f());
  }, [props.plot]);

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
          for (let i = 0, pi = 0; pi < line.numPoints; i++) {
            // i: data index, pi: number of point
            // 最大numPoints個の点しか描画できない
            if (minI + i < 0) {
              continue;
            }
            if (minI + i >= data.current.length) {
              i = data.current.length - minI - 1;
            }
            // x: -1 ~ 1
            x =
              -1 +
              ((data.current[minI + i].x.getTime() - minX.current!) /
                (maxX.current! - minX.current!)) *
                2;
            y = data.current[minI + i].y;
            if (!prevY) {
              prevY = y;
            }
            line.setX(pi * 2, x);
            line.setY(pi * 2, prevY);
            line.setX(pi * 2 + 1, x);
            line.setY(pi * 2 + 1, y);
            pi++;
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

          const rem = parseFloat(
            getComputedStyle(document.documentElement).fontSize
          );

          yTick.current = Math.pow(
            10,
            Math.floor(Math.log10(maxY.current - minY.current))
          );
          while (
            (maxY.current - minY.current) / (yTick.current / 10) <=
            canvasDiv.current.clientHeight / (1 * rem)
          ) {
            yTick.current /= 10;
          }
          if (
            (maxY.current - minY.current) / (yTick.current / 5) <=
            canvasDiv.current.clientHeight / (1 * rem)
          ) {
            yTick.current /= 5;
          } else if (
            (maxY.current - minY.current) / (yTick.current / 2) <=
            canvasDiv.current.clientHeight / (1 * rem)
          ) {
            yTick.current /= 2;
          }
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
  }, [layoutChanging, plotEnabled]);

  // グリッド
  const yTick = useRef<number>(1);
  const xTick = useRef<number>(1);

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

  // カーソルを乗せた位置の値を表示する用
  const [cursorPosXRaw, setCursorPosXRaw] = useState<number | null>(null);
  let cursorX: number | null = null;
  let cursorY: number | null = null;
  let cursorI: number | null = null;
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
    cursorX = getPosX(data.current[nearestI].x.getTime());
    cursorY = getPosY(data.current[nearestI].y);
    cursorI = nearestI;
  }

  return (
    <Card titlePre={props.plot.member.name} title={props.plot.name}>
      <div className="flex flex-col h-full">
        <div className="flex-1 w-full min-h-0 flex flex-row text-xs">
          <div className="flex-1 h-full min-w-0 pt-2 relative select-none">
            {[
              ...new Array(
                Math.max(
                  Math.floor(maxY.current / yTick.current) -
                    Math.ceil(minY.current / yTick.current) +
                    1,
                  0
                )
              ).keys(),
            ]
              .map(
                (_, i) =>
                  (Math.ceil(minY.current / yTick.current) + i) * yTick.current
              )
              .map((y, i) => (
                <div
                  key={i}
                  className="absolute w-full h-auto left-0 border-b border-gray-300 text-gray-500"
                  style={{ bottom: getPosY(y) }}
                >
                  {y == 0
                    ? 0
                    : Math.log10(Math.abs(y)) >= 5
                    ? y.toExponential(
                        Math.floor(Math.log10(Math.abs(y))) -
                          Math.floor(Math.log10(yTick.current))
                      )
                    : Math.log10(Math.abs(y)) >= -5
                    ? y.toFixed(
                        Math.max(0, -Math.floor(Math.log10(yTick.current)))
                      )
                    : y.toExponential(
                        Math.floor(Math.log10(Math.abs(y))) -
                          Math.floor(Math.log10(yTick.current))
                      )}
                </div>
              ))}
            {maxX.current &&
              minX.current &&
              canvasMain.current &&
              [
                ...new Array(
                  Math.max(
                    Math.floor(maxX.current / xTick.current) -
                      Math.ceil(minX.current / xTick.current),
                    0
                  )
                ).keys(),
              ]
                .map(
                  (_, i) =>
                    (Math.floor(maxX.current! / xTick.current) - i) *
                    xTick.current
                )
                .map((x, i) => (
                  <div
                    key={i}
                    className="absolute w-auto h-full bottom-0 border-r border-gray-300 text-gray-500"
                    style={{
                      right: canvasMain.current!.width - getPosX(x),
                    }}
                  >
                    <span className="absolute bottom-0 right-0">{x}</span>
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
                  // onPointerMove(e);
                }}
                onPointerLeave={(e) => {
                  setCursorPosXRaw(null);
                  // onPointerUp(e);
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
