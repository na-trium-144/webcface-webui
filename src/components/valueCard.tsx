import { Card } from "./card";
import { Value } from "webcface";
import { useState, useEffect, useRef } from "react";
import TimeChart from "timechart";
// import ReactSlider from "react-slider";
// import { format, addMilliseconds } from "date-fns";

interface Props {
  value: Value;
}

export function ValueCard(props: Props) {
  // const canvasMain = useRef<HTMLCanvasElement>(null);
  const canvasDiv = useRef<HTMLDivElement>(null);
  const chart = useRef<TimeChart | null>(null);
  const data = useRef<{ x: number; y: number }[]>([]);
  const divPreviousWidth = useRef<number>(0);
  const divPreviousHeight = useRef<number>(0);
  const lastUpdate = useRef<Date>(new Date());
  const startTime = useRef<Date>(new Date());
  const [followRealTime, setFollowRealTime] = useState<boolean>(true);

  useEffect(() => {
    const onValueChange = () => {
      const val = props.value.tryGet();
      if (val != null) {
        const now = props.value.time();
        if (now.getTime() < lastUpdate.current.getTime()) {
          console.error(`invalid time ${now.toLocaleString()}`);
        } else {
          lastUpdate.current = now;
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
    onValueChange();
    props.value.member.onSync.on(onValueChange);
    return () => props.value.member.onSync.off(onValueChange);
  }, [props.value]);

  const followChart = (f: boolean) => {
    if (chart.current) {
      chart.current.options.realTime = f;
      if (f) {
        chart.current.options.yRange = "auto";
      }
      setFollowRealTime(f);
    }
  };
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
          xRange: { min: 0, max: 5 * 1000 },
          yRange: "auto",
          realTime: true,
          zoom: {
            x: {
              autoRange: true,
            },
            y: {
              autoRange: true,
            },
          },
          tooltip: {
            enabled: true,
            xLabel: "Time",
            xFormatter: (x) =>
              new Date(x + startTime.current.getTime()).toLocaleString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                fractionalSecondDigits: 3,
              }),
          },
          legend: false,
        });
      }
    };
    const disposeChart = () => {
      if (chart.current) {
        chart.current.dispose();
        chart.current = null;
      }
    };
    const resizeChart = () => {
      if (chart.current) {
        chart.current.onResize();
      }
    };
    createChart();

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
        // disposeChart();
        // createChart();
        resizeChart();
      }
    }, 100);
    return () => {
      clearInterval(updateInt);
      disposeChart();
    };
  }, []);
  useEffect(() => {
    const i = setInterval(() => {
      if (chart.current && chart.current.options.realTime != followRealTime) {
        setFollowRealTime(chart.current.options.realTime);
      }
    }, 100);
    return () => clearInterval(i);
  }, [followRealTime]);
  return (
    <Card title={`${props.value.member.name}:${props.value.name}`}>
      <div className="flex flex-col h-full">
        <div className="flex-1 w-full min-h-0 flex flex-row text-xs">
          <div className="w-full h-full relative" ref={canvasDiv}></div>
        </div>
        <div className="flex-none flex items-center px-2 space-x-1 text-sm">
          <input
            type="checkbox"
            id={`follow-${props.value.member.name}:${props.value.name}`}
            checked={followRealTime}
            onChange={(e) => followChart(e.target.checked)}
          />
          <label
            htmlFor={`follow-${props.value.member.name}:${props.value.name}`}
          >
            Follow Latest Data
          </label>
        </div>
      </div>
    </Card>
  );
}

/*
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
*/
