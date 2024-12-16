import { useState, useEffect } from "react";
import {
  Client,
  Member,
  Value,
  View,
  Image,
  RobotModel,
  Canvas3D,
  Canvas2D,
  Log,
  Text,
} from "webcface";
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
import { ImageCard } from "./imageCard";
import { TextCard } from "./textCard";
import { FuncCard, PinnedFuncCard } from "./funcCard";
import { LogCard, LogCardServer } from "./logCard";
import { ViewCard } from "./viewCard";
import { RobotModelCard } from "./robotModelCard";
import { Canvas3DCard } from "./canvas3DCard";
import { Canvas2DCard } from "./canvas2DCard";
import { ConnectionInfoCard } from "./connectionInfoCard";
import { AboutCard } from "./aboutCard";
import { LauncherCard } from "./launcherCard";
import { useForceUpdate } from "../libs/forceUpdate";
import { useLocalStorage, LocalStorage } from "./lsProvider";
import * as cardKey from "../libs/cardKey";
import { useLayoutChange } from "./layoutChangeProvider";

interface Props {
  client: Client | null;
}

export function LayoutMain(props: Props) {
  const { setLayoutChanging } = useLayoutChange();
  const update = useForceUpdate();
  useEffect(() => {
    const setMemberEventListener = (m: Member) => {
      m.onValueEntry.on(update);
      m.onViewEntry.on(update);
      m.onImageEntry.on(update);
      m.onRobotModelEntry.on(update);
      m.onCanvas3DEntry.on(update);
      m.onCanvas2DEntry.on(update);
      m.onLogEntry.on(update);
    };
    const onMembersChange = (m: Member) => {
      update();
      setMemberEventListener(m);
    };
    for (const m of props.client?.members() || []) {
      setMemberEventListener(m);
    }
    props.client?.onMemberEntry.on(onMembersChange);
    return () => {
      props.client?.onMemberEntry.off(onMembersChange);
      for (const m of props.client?.members() || []) {
        m.onValueEntry.off(update);
        m.onViewEntry.off(update);
        m.onImageEntry.off(update);
        m.onRobotModelEntry.off(update);
        m.onCanvas3DEntry.off(update);
        m.onCanvas2DEntry.off(update);
        m.onLogEntry.off(update);
      }
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
    if (
      layouts.xxl &&
      layouts.xxl.filter((l) => !ls.isOpened(l.i)).length > 0
    ) {
      setLayouts(layoutsAll(layouts.xxl.filter((l) => ls.isOpened(l.i))));
    }
  }, [ls, layoutsAll, layouts]);

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={70}
      onLayoutChange={onLayoutChange}
      allowOverlap
      draggableHandle=".MyCardHandle"
      onDragStart={() => setLayoutChanging(true)}
      onResizeStart={() => setLayoutChanging(true)}
      onDragStop={() => setLayoutChanging(false)}
      onResizeStop={() => setLayoutChanging(false)}
    >
      {(() => {
        const key = cardKey.about();
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 4, 2, 2, 2)}>
              <AboutCard />
            </div>
          );
        }
      })()}
      {(() => {
        const key = cardKey.launcher();
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 4, 2, 2, 2)}>
              <LauncherCard />
            </div>
          );
        }
      })()}
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
      {(() => {
        const key = cardKey.pinnedFunc();
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 6, 2, 2, 2)}>
              <PinnedFuncCard wcli={props.client} />
            </div>
          );
        }
      })()}
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.values()), [] as Value[])
        .map((v) => {
          const key = cardKey.value(v.member.name, v.name);
          const withPlot = ls.valueCardWithPlot.some(
            (p) => p[0] === v.member.name && p[1] === v.name
          );
          const minH = withPlot ? 3 : 1;
          const minW = withPlot ? 2 : 1;
          if (ls.isOpened(key)) {
            return (
              <div
                key={key}
                data-grid={findLsLayout(key, 0, 0, minW, minH, minW, minH)}
              >
                <ValueCard value={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.texts()), [] as Text[])
        .map((v) => {
          const key = cardKey.text(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 1, 1, 1, 1)}>
                <TextCard text={v} />
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
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.images()), [] as Image[])
        .map((v) => {
          const key = cardKey.image(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 1)}>
                <ImageCard image={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.robotModels()), [] as RobotModel[])
        .map((v) => {
          const key = cardKey.robotModel(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 1)}>
                <RobotModelCard robotModel={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.canvas3DEntries()), [] as Canvas3D[])
        .map((v) => {
          const key = cardKey.canvas3D(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 1)}>
                <Canvas3DCard canvas3D={v} />
              </div>
            );
          }
          return null;
        })}
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.canvas2DEntries()), [] as Canvas2D[])
        .map((v) => {
          const key = cardKey.canvas2D(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 2, 2, 2, 1)}>
                <Canvas2DCard canvas={v} />
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
      {props.client
        ?.members()
        .reduce((prev, m) => prev.concat(m.logEntries()), [] as Log[])
        .map((v) => {
          const key = cardKey.log(v.member.name, v.name);
          if (ls.isOpened(key)) {
            return (
              <div key={key} data-grid={findLsLayout(key, 0, 0, 6, 2, 2, 2)}>
                <LogCard logField={v} />
              </div>
            );
          }
          return null;
        })}
      {(() => {
        const key = cardKey.serverLog();
        if (ls.isOpened(key)) {
          return (
            <div key={key} data-grid={findLsLayout(key, 0, 0, 6, 2, 2, 2)}>
              <LogCardServer />
            </div>
          );
        }
        return null;
      })()}
    </ResponsiveGridLayout>
  );
}
