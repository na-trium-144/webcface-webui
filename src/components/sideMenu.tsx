import { useState, useEffect, ReactElement } from "react";
import {
  Client,
  Member,
  Value,
  View,
  Image,
  RobotModel,
  Canvas3D,
} from "webcface";
import * as cardKey from "../libs/cardKey";
import { useForceUpdate } from "../libs/forceUpdate";
import { useLocalStorage } from "./lsProvider";
import { useLogStore } from "./logStoreProvider";
import {
  BroadcastRadio,
  Right,
  Down,
  Analysis,
  PageTemplate,
  Text as TextIcon,
  Abnormal,
  PlayOne,
  Info,
  FolderOpen,
  FolderClose,
  Pic,
  UploadWeb,
  DownloadWeb,
  DatabasePoint,
  ListSuccess,
  SwitchButton,
  RobotTwo,
  CoordinateSystem,
} from "@icon-park/react";

const iconFillColor = ["#333", "#6c6"];

interface Props {
  client: Client | null;
}
export function SideMenu(props: Props) {
  const ls = useLocalStorage();
  const update = useForceUpdate();
  useEffect(() => {
    const onMembersChange = (m: Member) => {
      update();
      m.onValueEntry.on(update);
      m.onViewEntry.on(update);
      m.onImageEntry.on(update);
      m.onRobotModelEntry.on(update);
      m.onCanvas3DEntry.on(update);
    };
    props.client?.onMemberEntry.on(onMembersChange);
    return () => {
      props.client?.onMemberEntry.off(onMembersChange);
    };
  }, [props.client, update]);
  return (
    <>
      {window.electronAPI && <SideMenuServer />}
      <SideMenuButton2
        name="Connection Info"
        active={ls.isOpened(cardKey.connectionInfo())}
        onClick={() => ls.toggleOpened(cardKey.connectionInfo())}
        icon={<Info />}
        iconActive={<Info theme="two-tone" fill={iconFillColor} />}
      />
      {props.client?.members().map((m, mi) => (
        <SideMenuMember
          key={mi}
          member={m}
          values={m.values()}
          views={m.views()}
          images={m.images()}
          robotModels={m.robotModels()}
          canvas3Ds={m.canvas3DEntries()}
        />
      ))}
    </>
  );
}

interface FieldGroup {
  name: string;
  fullName: string;
  kind: 0 | 3 | 5 | 6 | 7 | null;
  children: FieldGroup[];
}
interface GroupProps {
  name: string;
  children: ReactElement | ReactElement[];
}
function SideMenuGroup(props: GroupProps) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      <div>
        <SideMenuButton
          name={props.name}
          onClick={() => setOpen(!open)}
          active={open}
          icon={<FolderClose />}
          iconActive={<FolderOpen />}
        />
      </div>
      <ul className={"pl-4 " + (open ? "block " : "hidden ")}>
        {props.children}
      </ul>
    </>
  );
}

interface ValuesProps {
  groups: FieldGroup[];
  member: Member;
  isOpened: (key: string) => boolean;
  toggleOpened: (key: string) => void;
}
function SideMenuValues(props: ValuesProps) {
  return props.groups.map((v, vi) => (
    <li key={vi}>
      {v.kind === null ? (
        <SideMenuGroup name={v.name}>
          <SideMenuValues {...props} groups={v.children} />
        </SideMenuGroup>
      ) : (
        <SideMenuButton2
          name={v.name}
          active={props.isOpened(
            v.kind === 0
              ? cardKey.value(props.member.name, v.fullName)
              : v.kind === 3
              ? cardKey.view(props.member.name, v.fullName)
              : v.kind === 5
              ? cardKey.image(props.member.name, v.fullName)
              : v.kind === 6
              ? cardKey.robotModel(props.member.name, v.fullName)
              : cardKey.canvas3D(props.member.name, v.fullName)
          )}
          onClick={() =>
            props.toggleOpened(
              v.kind === 0
                ? cardKey.value(props.member.name, v.fullName)
                : v.kind === 3
                ? cardKey.view(props.member.name, v.fullName)
                : v.kind === 5
                ? cardKey.image(props.member.name, v.fullName)
                : v.kind === 6
                ? cardKey.robotModel(props.member.name, v.fullName)
                : cardKey.canvas3D(props.member.name, v.fullName)
            )
          }
          icon={
            v.kind === 0 ? (
              <Analysis />
            ) : v.kind === 3 ? (
              <PageTemplate />
            ) : v.kind === 5 ? (
              <Pic />
            ) : v.kind === 6 ? (
              <RobotTwo />
            ) : (
              <CoordinateSystem />
            )
          }
          iconActive={
            v.kind === 0 ? (
              <Analysis theme="two-tone" fill={iconFillColor} />
            ) : v.kind === 3 ? (
              <PageTemplate theme="two-tone" fill={iconFillColor} />
            ) : v.kind === 5 ? (
              <Pic theme="two-tone" fill={iconFillColor} />
            ) : v.kind === 6 ? (
              <RobotTwo theme="two-tone" fill={iconFillColor} />
            ) : (
              <CoordinateSystem theme="two-tone" fill={iconFillColor} />
            )
          }
        />
      )}
    </li>
  ));
}

interface MemberProps {
  member: Member;
  values: Value[];
  views: View[];
  images: Image[];
  robotModels: RobotModel[];
  canvas3Ds: Canvas3D[];
}
function SideMenuMember(props: MemberProps) {
  const logStore = useLogStore();
  const ls = useLocalStorage();
  const [open, setOpen] = useState<boolean>(false);
  const [valueNames, setValueNames] = useState<FieldGroup[]>([]);
  const [textNum, setTextNum] = useState<number>(0);
  const [funcNum, setFuncNum] = useState<number>(0);
  const [hasLog, setHasLog] = useState<boolean>(false);
  useEffect(() => {
    const update = () => {
      setTextNum(props.member.texts().length);
      setFuncNum(props.member.funcs().length);
      setHasLog(
        props.member.log().get().length > 0 ||
          logStore.data.current.find((ld) => ld.name === props.member.name) !==
            undefined
      );
    };
    const i = setInterval(update, 100);
    return () => clearInterval(i);
  }, [props.member]);
  useEffect(() => {
    const valueNames: FieldGroup[] = [];
    const sortValueNames = (
      values: Value[] | View[] | Image[] | RobotModel[] | Canvas3D[],
      kind: 0 | 3 | 5 | 6 | 7
    ) => {
      for (const v of values) {
        const vNameSplit = v.name.split(".");
        let valueNamesCurrent = valueNames;
        for (let d = 0; d < vNameSplit.length; d++) {
          const valueNamesFind = valueNamesCurrent.find(
            (n) => n.name === vNameSplit[d]
          );
          if (valueNamesFind == undefined) {
            const newChildren: FieldGroup[] = [];
            valueNamesCurrent.push({
              name: vNameSplit[d],
              fullName: v.name,
              children: newChildren,
              kind: d === vNameSplit.length - 1 ? kind : null,
            });
            valueNamesCurrent.sort((a, b) =>
              a.name > b.name ? 1 : a.name < b.name ? -1 : 0
            );
            valueNamesCurrent = newChildren;
          } else {
            valueNamesCurrent = valueNamesFind.children;
          }
        }
      }
    };
    sortValueNames(props.values, 0);
    sortValueNames(props.views, 3);
    sortValueNames(props.images, 5);
    sortValueNames(props.robotModels, 6);
    sortValueNames(props.canvas3Ds, 7);
    setValueNames(valueNames);
  }, [
    props.values,
    props.views,
    props.images,
    props.robotModels,
    props.canvas3Ds,
  ]);
  return (
    <>
      <div>
        <SideMenuButton
          name={props.member.name}
          onClick={() => setOpen(!open)}
          active={open}
          icon={<BroadcastRadio />}
        />
      </div>
      <ul className={"pl-4 " + (open ? "block " : "hidden ")}>
        <SideMenuValues
          {...props}
          groups={valueNames}
          isOpened={ls.isOpened}
          toggleOpened={ls.toggleOpened}
        />
        {textNum > 0 && (
          <li>
            <SideMenuButton2
              name={"Text Variables"}
              active={ls.isOpened(cardKey.text(props.member.name))}
              onClick={() => ls.toggleOpened(cardKey.text(props.member.name))}
              icon={<TextIcon />}
              iconActive={<TextIcon theme="two-tone" fill={iconFillColor} />}
            />
          </li>
        )}
        {hasLog && (
          <li>
            <SideMenuButton2
              name={"Logs"}
              active={ls.isOpened(cardKey.log(props.member.name))}
              onClick={() => ls.toggleOpened(cardKey.log(props.member.name))}
              icon={<Abnormal />}
              iconActive={<Abnormal theme="two-tone" fill={iconFillColor} />}
            />
          </li>
        )}
        {funcNum > 0 && (
          <li>
            <SideMenuButton2
              name={"Functions"}
              active={ls.isOpened(cardKey.func(props.member.name))}
              onClick={() => ls.toggleOpened(cardKey.func(props.member.name))}
              icon={<PlayOne />}
              iconActive={<PlayOne theme="two-tone" fill={iconFillColor} />}
            />
          </li>
        )}
      </ul>
    </>
  );
}

function SideMenuServer() {
  const ls = useLocalStorage();
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      <div>
        <SideMenuButton
          name="Server"
          onClick={() => setOpen(!open)}
          active={open}
          icon={<DatabasePoint />}
        />
      </div>
      <ul className={"pl-4 " + (open ? "block " : "hidden ")}>
        <li>
          <SideMenuButton2
            name="Import Config..."
            active={false}
            onClick={() => window.electronAPI?.config.import()}
            icon={<UploadWeb />}
            iconActive={<UploadWeb theme="two-tone" fill={iconFillColor} />}
          />
        </li>
        <li>
          <SideMenuButton2
            name="Export Config..."
            active={false}
            onClick={() => window.electronAPI?.config.export()}
            icon={<DownloadWeb />}
            iconActive={<DownloadWeb theme="two-tone" fill={iconFillColor} />}
          />
        </li>
        <li>
          <SideMenuButton2
            name="Server Status"
            active={ls.isOpened(cardKey.about())}
            onClick={() => ls.toggleOpened(cardKey.about())}
            icon={<SwitchButton />}
            iconActive={<SwitchButton theme="two-tone" fill={iconFillColor} />}
          />
        </li>
        <li>
          <SideMenuButton2
            name="Logs"
            active={ls.isOpened(cardKey.serverLog())}
            onClick={() => ls.toggleOpened(cardKey.serverLog())}
            icon={<Abnormal />}
            iconActive={<Abnormal theme="two-tone" fill={iconFillColor} />}
          />
        </li>
        <li>
          <SideMenuButton2
            name="Launcher Config"
            active={ls.isOpened(cardKey.launcher())}
            onClick={() => ls.toggleOpened(cardKey.launcher())}
            icon={<ListSuccess />}
            iconActive={<ListSuccess theme="two-tone" fill={iconFillColor} />}
          />
        </li>
      </ul>
    </>
  );
}
interface ButtonProps {
  name: string;
  active?: boolean;
  onClick: () => void;
  icon?: ReactElement;
  iconActive?: ReactElement;
}
function SideMenuButton(props: ButtonProps) {
  return (
    <button
      className="hover:text-green-700 w-full pl-1 flex items-center space-x-1 mt-0.5 "
      onClick={props.onClick}
    >
      <span>
        {props.active && props.iconActive ? props.iconActive : props.icon}
      </span>
      <span>{props.name}</span>
      {props.active ? <Down className="pt-0.5" /> : <Right />}
    </button>
  );
}
function SideMenuButton2(props: ButtonProps) {
  return (
    <button
      className={
        "w-full pl-1 flex items-center space-x-1 mt-0.5 " +
        (props.active
          ? "bg-green-100 hover:bg-green-200 active:bg-green-300 "
          : "hover:bg-neutral-100 active:bg-neutral-200 ")
      }
      onClick={props.onClick}
    >
      <span>
        {props.active && props.iconActive ? props.iconActive : props.icon}
      </span>
      <span>{props.name}</span>
    </button>
  );
}
