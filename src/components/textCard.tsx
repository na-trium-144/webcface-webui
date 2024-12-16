import { Card } from "./card";
import { Text } from "webcface";
import { useEffect, useRef, useState } from "react";

interface Props {
  text: Text;
}
export function TextCard(props: Props) {
  const [text, setText] = useState<string>("");
  const prevText = useRef<string>("");
  const [color, setColor] = useState<string>("");
  const hasUpdate = useRef<boolean>(true);
  useEffect(() => {
    const i = setInterval(() => {
      if (hasUpdate.current) {
        setText(props.text.get());
        hasUpdate.current = false;
      }
    }, 50);
    return () => clearInterval(i);
  }, [props.text]);
  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.text.on(update);
    return () => props.text.off(update);
  }, [props.text]);
  useEffect(() => {
    if (prevText.current !== text) {
      setColor("text-green-600");
      prevText.current = text;
      const i = setTimeout(() => {
        setColor("");
      }, 500);
      return () => clearTimeout(i);
    }
  }, [text]);
  return (
    <Card titlePre={props.text.member.name} title={props.text.name}>
      <div className="flex flex-row">
        <div className="flex-1" />
        <div className={"flex-none w-full text-center " + color}>{text}</div>
      </div>
    </Card>
  );
}
