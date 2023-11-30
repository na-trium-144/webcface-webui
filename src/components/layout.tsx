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
  client: Client | null;
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

  const breakpoints = {
    xxl: 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640,
    xs: 0,
  };
  const cols = { xxl: 15, xl: 13, lg: 10, md: 7, sm: 6, xs: 2 };
  const [layouts, setLayouts] = useState<ResponsiveLayout<Breakpoint>>({});
  // 全breakpointで同じレイアウトをぶちこむ
  const layoutsAll = (layout: LayoutItem[]) => {
    return Object.keys(breakpoints).reduce((obj, k) => {
      obj[k] = layout.map((l) => ({ ...l }));
      return obj;
    }, {} as ResponsiveLayout<Breakpoint>);
  };

  // lsのlayoutには現在表示していないものも含まれる
  const ls: LocalStorage = useLocalStorage();
  // 初期layoutとしてlsに以前のレイアウトがあればそれを使う
  // 閉じたカードはzが-1になるのでその場合新しいzを振る
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
    const newZ =
      ls.layout.reduce(
        (maxZ, l) => (l.z !== undefined && l.z > maxZ ? l.z : maxZ),
        0
      ) + 1;
    if (l !== undefined) {
      if (l.z === -1) {
        setTimeout(() =>
          ls.setLayout(
            ls.layout.map((l) => (l.i === i ? { ...l, z: newZ } : l))
          )
        );
        return { x: l.x, y: l.y, w: l.w, z: newZ, h: l.h, minW, minH };
      } else {
        return { x: l.x, y: l.y, w: l.w, z: l.z, h: l.h, minW, minH };
      }
    } else {
      setTimeout(() =>
        ls.setLayout(ls.layout.concat([{ i, x, y, w, h, z: newZ }]))
      );
      return { x, y, w, h, z: newZ, minW, minH };
    }
  };

  const onLayoutChange = ({ layout }: { layout: LayoutItem[] }) => {
    if (ls.init) {
      // lsに変更を反映する
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
      // rglに渡すbreakpointごとのレイアウトも変える
      setLayouts(layoutsAll(layout));
    }
  };

  // カード閉じたのにlayoutsに残存しているやつがあったら消す
  useEffect(() => {
    if (layouts.xxl.filter((l) => !ls.isOpened(l.i)).length > 0) {
      setLayouts(layoutsAll(layouts.xxl.filter((l) => ls.isOpened(l.i))));
    }
  }, [ls, layoutsAll, layouts]);

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
