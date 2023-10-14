import { useState, useEffect } from "react";
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
import { ValueCard } from "./valueCard";
import { TextCard } from "./textCard";
import { FuncCard } from "./funcCard";
import { LogCard } from "./logCard";
import { ViewCard } from "./viewCard";
import { ConnectionInfoCard } from "./connectionInfoCard";
import { useForceUpdate } from "../libs/forceUpdate";
import { useLocalStorage, LocalStorage } from "./lsProvider";
import * as cardKey from "../libs/cardKey";

interface Props {
  client: Client | null ;
}

export function LayoutMain(props: Props) {
  const update = useForceUpdate();
  useEffect(() => {
    const onMembersChange = (m: Member) => {
      update();
      m.onValueEntry.on(update);
      m.onViewEntry.on(update);
    };
    props.client?.onMemberEntry.on(onMembersChange);
    return () => {
      props.client?.onMemberEntry.off(onMembersChange);
    };
  }, [props.client, update]);

  const [layouts, setLayouts] = useState<ResponsiveLayout<Breakpoint>>({});
  const ls: LocalStorage = useLocalStorage();

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
    const l = ls.layout.find((l) => l.i === i);
    if (l !== undefined) {
      return { x: l.x, y: l.y, w: l.w, h: l.h, minW, minH };
    } else {
      return { x, y, w, h, minW, minH };
    }
  };

  const onLayoutChange = ({ layout }: { layout: LayoutItem[] }) => {
    if (ls.init) {
      ls.setLayout((lsLayout: LayoutItem[]) => {
        for (let nli = 0; nli < layout.length; nli++) {
          const lli = lsLayout.findIndex((ll) => ll.i === layout[nli].i);
          if (lli < 0) {
            lsLayout.push(layout[nli]);
          } else {
            lsLayout[lli] = layout[nli];
          }
        }
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
      draggableHandle=".MyCardHandle"
    >
      {(() => {
        const key = cardKey.connectionInfo();
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 4, 2, 2, 2)}>
              <ConnectionInfoCard client={props.client} />
            </div>
          );
        }
      })()}
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.values()), [] as Value[])
        .map((v) => {
          const key = cardKey.value(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 2)}>
                <ValueCard value={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.views()), [] as View[])
        .map((v) => {
          const key = cardKey.view(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 1)}>
                <ViewCard view={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client?.members().map((m) => {
        const key = cardKey.text(m.name);
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 4, 2, 2, 1)}>
              <TextCard member={m} />
            </div>
          );
        }
        return null;
      })}
      {props.client?.members().map((m) => {
        const key = cardKey.func(m.name);
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 6, 2, 2, 2)}>
              <FuncCard member={m} />
            </div>
          );
        }
        return null;
      })}
      {props.client?.members().map((m) => {
        const key = cardKey.log(m.name);
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 6, 2, 2, 2)}>
              <LogCard member={m} />
            </div>
          );
        }
        return null;
      })}
    </ResponsiveGridLayout>
  );
}
