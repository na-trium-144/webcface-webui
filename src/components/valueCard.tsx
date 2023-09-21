import { Card } from "./card";
import { Value } from "webcface";
import { useState, useEffect, useRef } from "react";
// import { WebglPlot, WebglLine, ColorRGBA } from "webgl-plot";
import TimeChart from "timechart";
// import { lineChart } from "timechart/plugins/lineChart";
// import { d3Axis } from "timechart/plugins/d3Axis";
// import { legend } from "timechart/plugins/legend";
// import { crosshair } from "timechart/plugins/crosshair";
// import { nearestPoint } from "timechart/plugins/nearestPoint";
// import { TimeChartZoomPlugin } from "timechart/plugins/chartZoom";
// import { TimeChartTooltipPlugin } from "timechart/plugins/tooltip";
// import ReactSlider from "react-slider";
import { format, addMilliseconds } from "date-fns";

interface Props {
  value: Value;
}

const numPoints = 5000;

export function ValueCard(props: Props) {
  // const canvasMain = useRef<HTMLCanvasElement>(null);
  const canvasDiv = useRef<HTMLDivElement>(null);
  const chart = useRef<TimeChart | null>(null);
  const data = useRef<{ x: number; y: number }[]>([]);
  const currentPos = useRef<number>(0);
  const isLatest = useRef<boolean>(true);
  const divPreviousWidth = useRef<number>(0);
  const divPreviousHeight = useRef<number>(0);
  const [displayMinY, setDisplayMinY] = useState<number>(0);
  const [displayMaxY, setDisplayMaxY] = useState<number>(0);
  const [displayPos, setDisplayPos] = useState<number>(0);
  const [maxPos, setMaxPos] = useState<number>(0);
  const lastUpdate = useRef<Date>(new Date());
  const startTime = useRef<Date>(new Date());

  useEffect(() => {
    const onValueChange = (v: Value) => {
      const val = v.tryGet();
      if (val != null) {
        const now = v.time();
        const timeDiff = now.getTime() - lastUpdate.current.getTime();
        if (timeDiff < 0) {
          console.error(`invalid timeDiff ${timeDiff}`);
        } else {
          lastUpdate.current = now;
          // if (data.current.length === 0) {
          //   setStartTime(now);
          // }
          // for (let t = 0; t < timeDiff; t++) {
          // data.current.push(val);
          // }
          data.current.push({
            x: now.getTime() - startTime.current.getTime(),
            y: val,
          });
        }
        if (chart.current) {
          chart.current.update();
          console.log("update");
        }
      }
    };
    onValueChange(props.value);
    props.value.on(onValueChange);
    return () => props.value.off(onValueChange);
  }, [props.value]);

  useEffect(() => {
    const createChart = () => {
      if (canvasDiv.current) {
        chart.current = new TimeChart(canvasDiv.current, {
          series: [
            {
              name: "a",
              data: data.current,
            },
          ],
          baseTime: startTime.current.getTime(),
          /*plugins: {
          lineChart,
          d3Axis,
          legend,
          crosshair,
          nearestPoint,
          zoom: new TimeChartZoomPlugin({}),
          tooltip: new TimeChartTooltipPlugin({}),
        },*/
          xRange: { min: 0, max: 5 * 1000 },
          realTime: true,
          zoom: {
            x: {
              autoRange: true,
              // minDomainExtent: 50,
            },
            y: {
              autoRange: true,
              // minDomainExtent: 1,
            },
          },
          tooltip: {
            enabled: true,
            // xFormatter: (x) => new Date(x + baseTime).toLocaleString([], {hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3}),
          },
        });
      }
    };
    const disposeChart = () => {
      if (chart.current) {
        chart.current.dispose();
        chart.current = null;
      }
    };

    const updateInt = setInterval(() => {
      if (canvasDiv.current == null) {
        return;
      }
      if (
        divPreviousWidth.current != canvasDiv.current.clientWidth ||
        divPreviousHeight.current !== canvasDiv.current.clientHeight
      ) {
        divPreviousWidth.current = canvasDiv.current.clientWidth;
        divPreviousHeight.current = canvasDiv.current.clientHeight;
        disposeChart();
        createChart();
      }
    }, 100);
    return () => {
      clearInterval(updateInt);
      disposeChart();
    };
  }, []);

  return (
    <Card title={`${props.value.member.name}:${props.value.name}`}>
      <div className="flex flex-col h-full">
        <div className="flex-1 w-full min-h-0 flex flex-row text-xs">
          <div className="w-full h-full relative" ref={canvasDiv}></div>
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
