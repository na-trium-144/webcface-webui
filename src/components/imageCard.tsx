import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Image, imageCompressMode } from "webcface";
import { useEffect, useRef } from "react";

interface Props {
  image: Image;
}
export function ImageCard(props: Props) {
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
  }, [props.image, update]);
  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.image.on(update);
    props.image.request({ compressMode: imageCompressMode.webp, quality: 50 });
    return () => props.image.off(update);
  }, [props.image]);
  return (
    <Card title={`${props.image.member.name}:${props.image.name}`}>
      <div className="w-full h-full overflow-y-auto overflow-x-auto">
        <img
          className="max-w-full max-h-full m-auto"
          src={"data:image/webp;base64," + props.image.get().toBase64()}
        />
      </div>
    </Card>
  );
}
