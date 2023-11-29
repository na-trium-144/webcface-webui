import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Member, Text } from "webcface";
import { useEffect, useRef } from "react";

interface Props {
  member: Member;
}
export function TextCard(props: Props) {
  const hasUpdate = useRef<boolean>(true);
  const update = useForceUpdate();
  useEffect(() => {
    const i = setInterval(() => {
      if (hasUpdate.current) {
        update();
        hasUpdate.current = false;
      }
    }, 50);
    return () => clearInterval(i);
  }, [update]);
  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.member.texts().map((t: Text) => t.on(update));
    const onTextEntry = (t: Text) => {
      t.on(update);
      update();
    };
    props.member.onTextEntry.on(onTextEntry);
    return () => {
      props.member.onTextEntry.off(onTextEntry);
      props.member.texts().map((t: Text) => t.off(update));
    };
  }, [props.member, update]);
  return (
    <Card title={`${props.member.name} Text Variables`}>
      <div className="h-full overflow-y-auto">
        <ul className="list-none">
          {props.member
            .texts()
            .slice()
            .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
            .map((t) => (
              <li key={t.name}>
                {t.name} = {t.get()}
              </li>
            ))}
        </ul>
      </div>
    </Card>
  );
}
