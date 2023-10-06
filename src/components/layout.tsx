import { useState, useEffect, useRef } from "react";
import { Client, Member, Value, View } from "webcface";
import "../index.css";
import "react-grid-layout-next/css/styles.css";
import "react-resizable/css/styles.css";
import {
  ResponsiveGridLayout as ResponsiveGridLayoutOrig,
  WidthProvider,
  LayoutItem,
  ResponsiveLayout,
  Breakpoint,
} from "react-grid-layout-next";
const ResponsiveGridLayout = WidthProvider(ResponsiveGridLayoutOrig);
import { getLS, saveToLS } from "../libs/ls";
import { ValueCard } from "./valueCard";
import { TextCard } from "./textCard";
import { FuncCard } from "./funcCard";
import { LogCard } from "./logCard";
import { ViewCard } from "./viewCard";
import { ConnectionInfoCard } from "./connectionInfoCard";
import { useForceUpdate } from "../libs/forceUpdate";
import * as cardKey from "../libs/cardKey";

interface Props {
  client: { current: Client | null };
  isOpened: (key: string) => boolean;
  openedOrder: (key: string) => number;
  moveOrder: (key: string) => void;
}

export function LayoutMain(props: Props) {
  const update = useForceUpdate();
  useEffect(() => {
    const onMembersChange = (m: Member) => {
      update();
      m.onValueEntry.on(update);
      m.onViewEntry.on(update);
    };
    props.client.current?.onMemberEntry.on(onMembersChange);
    return () => {
      props.client.current?.onMemberEntry.off(onMembersChange);
    };
  }, [props.client, update]);

  const [layouts, setLayouts] = useState<ResponsiveLayout<Breakpoint>>({});
  const [lsLayout, setLsLayout] = useState<LayoutItem[]>([]);
  const [layoutsLoadDone, setLayoutsLoadDone] = useState<boolean>(false);

  const breakpoints = {
    xxl: 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640,
    xs: 0,
  };
  const cols = { xxl: 15, xl: 13, lg: 10, md: 7, sm: 6, xs: 2 };
  const layoutsAll = (layout: LayoutItem[]) => {
    return Object.keys(breakpoints).reduce((obj, k) => {
      obj[k] = layout.map((l) => ({ ...l }));
      return obj;
    }, {} as ResponsiveLayout<Breakpoint>);
  };
  const findLsLayout = (
    i: string,
    x: number,
    y: number,
    w: number,
    h: number,
    minW: number,
    minH: number
  ) => {
    const l = lsLayout.find((l) => l.i === i);
    if (l !== undefined) {
      return { x: l.x, y: l.y, w: l.w, h: l.h, minW, minH };
    } else {
      return { x, y, w, h, minW, minH };
    }
  };

  useEffect(() => {
    const ls = getLS().layout;
    setLsLayout(ls);
    // setLayouts(layoutsAll(ls));
    setLayoutsLoadDone(true);
  }, []);

  const onLayoutChange = ({ layout }: { layout: LayoutItem[] }) => {
    if (layoutsLoadDone) {
      setLsLayout((lsLayout) => {
        for (let nli = 0; nli < layout.length; nli++) {
          const lli = lsLayout.findIndex((ll) => ll.i === layout[nli].i);
          if (lli < 0) {
            lsLayout.push(layout[nli]);
          } else {
            lsLayout[lli] = layout[nli];
          }
        }
        saveToLS({ layout: lsLayout });
        return lsLayout.slice();
      });
      setLayouts(layoutsAll(layout));
    }
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={100}
      onLayoutChange={onLayoutChange}
      allowOverlap
      compactType={null}
      draggableHandle=".MyCardHandle"
    >
      {(() => {
        const key = cardKey.connectionInfo();
        if (props.isOpened(key)) {
          return (
            <div
              key={key}
              data-grid={findLsLayout(key, 0, 0, 4, 2, 2, 2)}
              style={{
                zIndex: 10 + props.openedOrder(key),
              }}
              onPointerDown={() => props.moveOrder(key)}
            >
              <ConnectionInfoCard client={props.client} />
            </div>
          );
        }
      })()}
      {props.client.current
        ?.members()
        .reduce((prev, m) => prev.concat(m.values()), [] as Value[])
        .map((v) => {
          const key = cardKey.value(v.member.name, v.name);
          if (props.isOpened(key)) {
            return (
              <div
                key={key}
                data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 2)}
                style={{
                  zIndex: 10 + props.openedOrder(key),
                }}
                onPointerDown={() => props.moveOrder(key)}
              >
                <ValueCard value={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client.current
        ?.members()
        .reduce((prev, m) => prev.concat(m.views()), [] as View[])
        .map((v) => {
          const key = cardKey.view(v.member.name, v.name);
          if (props.isOpened(key)) {
            return (
              <div
                key={key}
                data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 1)}
                style={{
                  zIndex: 10 + props.openedOrder(key),
                }}
                onPointerDown={() => props.moveOrder(key)}
              >
                <ViewCard view={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client.current?.members().map((m) => {
        const key = cardKey.text(m.name);
        if (props.isOpened(key)) {
          return (
            <div
              key={key}
              data-grid={findLsLayout(key, 0, 0, 4, 2, 2, 1)}
              style={{ zIndex: 10 + props.openedOrder(key) }}
              onPointerDown={() => props.moveOrder(key)}
            >
              <TextCard member={m} />
            </div>
          );
        }
        return null;
      })}
      {props.client.current?.members().map((m) => {
        const key = cardKey.func(m.name);
        if (props.isOpened(key)) {
          return (
            <div
              key={key}
              data-grid={findLsLayout(key, 0, 0, 6, 2, 2, 2)}
              style={{ zIndex: 10 + props.openedOrder(key) }}
              onPointerDown={() => props.moveOrder(key)}
            >
              <FuncCard member={m} />
            </div>
          );
        }
        return null;
      })}
      {props.client.current?.members().map((m) => {
        const key = cardKey.log(m.name);
        if (props.isOpened(key)) {
          return (
            <div
              key={key}
              data-grid={findLsLayout(key, 0, 0, 6, 2, 2, 2)}
              style={{ zIndex: 10 + props.openedOrder(key) }}
              onPointerDown={() => props.moveOrder(key)}
            >
              <LogCard member={m} />
            </div>
          );
        }
        return null;
      })}
    </ResponsiveGridLayout>
  );
}
