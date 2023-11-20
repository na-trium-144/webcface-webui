import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Member, Text } from "webcface";
import { useEffect } from "react";

interface Props {
  member: Member;
}
export function TextCard(props: Props) {
  const update = useForceUpdate();
  useEffect(() => {
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
      <ul className="list-none">
        {props.member.texts().map((t) => (
          <li key={t.name}>
            {t.name} = {t.get()}
          </li>
        ))}
      </ul>
    </Card>
  );
}
