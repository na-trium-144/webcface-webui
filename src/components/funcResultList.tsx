import { useFuncResult } from "./funcResultProvider";
import { useState, useEffect } from "react";
import { CloseSmall } from "@icon-park/react";

interface ResultDisplay {
  member: string;
  name: string;
  status: number;
  result: string;
  show: boolean;
}
const funcStatus = {
  connecting: 0,
  running: 1,
  ok: 2,
  error: 3,
};

export function FuncResultList() {
  const { results } = useFuncResult();
  const [resultsDisplay, setResultsDisplay] = useState<ResultDisplay[]>([]);
  useEffect(() => {
    if (resultsDisplay.length < results.length) {
      const resultsDisplayNew = resultsDisplay.slice();
      for (let i = resultsDisplay.length; i < results.length; i++) {
        resultsDisplayNew.push({
          member: results[i].member.name,
          name: results[i].name,
          status: funcStatus.connecting,
          result: "",
          show: true,
        });
        setTimeout(() => {
          void results[i].started.then(() =>
            setResultsDisplay((resultsDisplay) =>
              resultsDisplay.map((d, j) =>
                i === j && d.status === funcStatus.connecting
                  ? { ...d, status: funcStatus.running }
                  : d
              )
            )
          );
        });
        const closeResult = () => {
          setResultsDisplay((resultsDisplay) =>
            resultsDisplay.map((d, j) => (i === j ? { ...d, show: false } : d))
          );
        };
        setTimeout(() => {
          void results[i].result
            .then((val: string | number | boolean | null) => {
              setResultsDisplay((resultsDisplay) =>
                resultsDisplay.map((d, j) =>
                  i === j
                    ? { ...d, result: String(val), status: funcStatus.ok }
                    : d
                )
              );
              setTimeout(closeResult, 5000);
            })
            .catch((e) => {
              setResultsDisplay((resultsDisplay) =>
                resultsDisplay.map((d, j) =>
                  i === j
                    ? {
                        ...d,
                        result: (e as Error).toString(),
                        status: funcStatus.error,
                      }
                    : d
                )
              );
              setTimeout(closeResult, 30000);
            });
        });
      }
      setResultsDisplay(resultsDisplayNew);
    }
  }, [results, resultsDisplay]);

  // console.log(results);
  // console.log(resultsDisplay);
  const listShow = resultsDisplay.filter((d) => d.show).length > 0;

  const [listBottom, setListBottom] = useState<number>(8);
  const [listRight, setListRight] = useState<number>(8);
  const [visualHeight, setVisualHeight] = useState<number>(200);
  useEffect(() => {
    setVisualHeight(window.innerHeight);
    if (window.visualViewport) {
      // https://ginpen.com/2023/08/08/update-height-by-keyboard-open-using-visual-viewport/
      // https://stackoverflow.com/questions/28161166/fixed-position-div-on-zoomed-browser-window-on-mobile
      const onWindowScroll = () => {
        setListBottom(
          8 +
            window.innerHeight -
            (window.visualViewport!.offsetTop + window.visualViewport!.height)
        );
        setListRight(
          8 +
            window.innerWidth -
            (window.visualViewport!.offsetLeft + window.visualViewport!.width)
        );
        setVisualHeight(window.visualViewport!.height);
      };
      onWindowScroll();
      window.visualViewport.addEventListener("resize", onWindowScroll);
      window.visualViewport.addEventListener("scroll", onWindowScroll);
      // https://developers.google.com/web/updates/2017/09/visual-viewport-api#gotchas
      window.addEventListener("scroll", onWindowScroll);
      return () => {
        window.visualViewport!.removeEventListener("resize", onWindowScroll);
        window.visualViewport!.removeEventListener("scroll", onWindowScroll);
        window.removeEventListener("scroll", onWindowScroll);
      };
    }
  }, []);

  return (
    <div
      className={
        "fixed w-72 h-auto p-2 " +
        "rounded-lg shadow-lg overflow-x-hidden overflow-y-auto bg-white " +
        "transition duration-100 origin-bottom-right " +
        (listShow
          ? "ease-out opacity-100 scale-100 z-[999] "
          : "ease-in opacity-0 scale-90 -z-10 ")
      }
      style={{
        bottom: listBottom,
        right: listRight,
        maxWidth: "80vw",
        maxHeight: visualHeight * 0.3,
      }}
    >
      <ul className="max-w-full">
        {resultsDisplay.map(
          (d, i) =>
            d.show && (
              <li key={i}>
                <span className="text-xs pr-1 break-all">{d.member}</span>
                <span className="text-sm pr-1 break-all">{d.name}</span>
                {
                  [
                    <span className="text-sm text-blue-500 ">
                      Connecting...
                    </span>,
                    <span className="text-sm text-green-500 ">Running...</span>,
                    <>
                      <span className="text-sm pr-1">ok</span>
                      <span className="text-sm font-noto-mono break-all">
                        {d.result}
                      </span>
                    </>,
                    <>
                      <span className="text-red-500 text-sm font-noto-mono break-all">
                        {d.result}
                      </span>
                    </>,
                  ][d.status]
                }
                <button
                  className="relative inline-block w-4 h-4 ml-1 bottom-1"
                  onClick={() =>
                    setResultsDisplay((resultsDisplay) =>
                      resultsDisplay.map((d, j) =>
                        i === j ? { ...d, show: false } : d
                      )
                    )
                  }
                >
                  <CloseSmall className="absolute top-0 left-0" />
                </button>
              </li>
            )
        )}
      </ul>
    </div>
  );
}
