import { useState, useEffect, ReactElement } from "react";
import { Client, Member, Value, View } from "webcface";
import * as cardKey from "../libs/cardKey";
import { useForceUpdate } from "../libs/forceUpdate";
import { useLocalStorage } from "./lsProvider";
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
    };
    props.client?.onMemberEntry.on(onMembersChange);
    return () => {
      props.client?.onMemberEntry.off(onMembersChange);
    };
  }, [props.client, update]);
  return (
    <>
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
        />
      ))}
    </>
  );
}

interface FieldGroup {
  name: string;
  fullName: string;
  children: FieldGroup[];
}
interface GroupProps {
  name: string;
  children: ReactElement[];
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
      {v.children.length > 0 ? (
        <SideMenuGroup name={v.name}>
          <SideMenuValues {...props} groups={v.children} />
        </SideMenuGroup>
      ) : (
        <SideMenuButton2
          name={v.name}
          active={props.isOpened(cardKey.value(props.member.name, v.fullName))}
          onClick={() =>
            props.toggleOpened(cardKey.value(props.member.name, v.fullName))
          }
          icon={<Analysis />}
          iconActive={<Analysis theme="two-tone" fill={iconFillColor} />}
        />
      )}
    </li>
  ));
}

interface MemberProps {
  member: Member;
  values: Value[];
  views: View[];
}
function SideMenuMember(props: MemberProps) {
  const ls = useLocalStorage();
  const [open, setOpen] = useState<boolean>(false);
  const [valueNames, setValueNames] = useState<FieldGroup[]>([]);
  useEffect(() => {
    const valueNames: FieldGroup[] = [];
    for (const v of props.values) {
      console.log("value", v.name);
      const vNameSplit = v.name.split(".");
      let valueNamesCurrent = valueNames;
      for (let d = 0; d < vNameSplit.length; d++) {
        console.log(JSON.parse(JSON.stringify(valueNamesCurrent)));
        const valueNamesFind = valueNamesCurrent.find(
          (n) => n.name === vNameSplit[d]
        );
        if (valueNamesFind == undefined) {
          const newChildren: FieldGroup[] = [];
          valueNamesCurrent.push({
            name: vNameSplit[d],
            fullName: v.name,
            children: newChildren,
          });
          valueNamesCurrent = newChildren;
        } else {
          valueNamesCurrent = valueNamesFind.children;
        }
      }
    }
    setValueNames(valueNames);
  }, [props.values]);
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
        <SideMenuValues {...props} groups={valueNames} />
        {props.views.map((v, vi) => (
          <li key={vi}>
            <SideMenuButton2
              name={v.name}
              active={ls.isOpened(cardKey.view(props.member.name, v.name))}
              onClick={() =>
                ls.toggleOpened(cardKey.view(props.member.name, v.name))
              }
              icon={<PageTemplate />}
              iconActive={
                <PageTemplate theme="two-tone" fill={iconFillColor} />
              }
            />
          </li>
        ))}
        <li>
          <SideMenuButton2
            name={"Text Variables"}
            active={ls.isOpened(cardKey.text(props.member.name))}
            onClick={() => ls.toggleOpened(cardKey.text(props.member.name))}
            icon={<TextIcon />}
            iconActive={<TextIcon theme="two-tone" fill={iconFillColor} />}
          />
        </li>
        <li>
          <SideMenuButton2
            name={"Logs"}
            active={ls.isOpened(cardKey.log(props.member.name))}
            onClick={() => ls.toggleOpened(cardKey.log(props.member.name))}
            icon={<Abnormal />}
            iconActive={<Abnormal theme="two-tone" fill={iconFillColor} />}
          />
        </li>
        <li>
          <SideMenuButton2
            name={"Functions"}
            active={ls.isOpened(cardKey.func(props.member.name))}
            onClick={() => ls.toggleOpened(cardKey.func(props.member.name))}
            icon={<PlayOne />}
            iconActive={<PlayOne theme="two-tone" fill={iconFillColor} />}
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
