import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { Image, imageCompressMode } from "webcface";
import { useEffect, useRef } from "react";

interface Props {
  image: Image;
}
export function ImageCard(props: Props) {
  const hasUpdate = useRef<boolean>(true);
  const imgRef = useRef(null);
  const prevImgWidth = useRef<number>(0);
  const prevImgHeight = useRef<number>(0);
  const update = useForceUpdate();
  useEffect(() => {
    const i = setInterval(() => {
      if (hasUpdate.current) {
        update();
        hasUpdate.current = false;
      }
      const ratio = props.image.get().width / props.image.get().height;
      if (!isNaN(ratio)) {
        if (
          prevImgWidth.current !== imgRef.current.clientWidth ||
          prevImgHeight.current !== imgRef.current.clientHeight
        ) {
          prevImgWidth.current = imgRef.current.clientWidth;
          prevImgHeight.current = imgRef.current.clientHeight;
          const imgRatio = prevImgWidth.current / prevImgHeight.current;
          let newWidth: number | undefined = undefined,
            newHeight: number | undefined = undefined;
          if (ratio > imgRatio) {
            newWidth = prevImgWidth.current;
          } else {
            newHeight = prevImgHeight.current;
          }
          console.log(`re-request ${newWidth} x ${newHeight}`)
          props.image.request({
            width: newWidth,
            height: newHeight,
            compressMode: imageCompressMode.jpeg,
            quality: 50,
            frameRate: 10,
          });
        }
      }
    }, 50);
    return () => clearInterval(i);
  }, [props.image, update]);
  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.image.on(update);
    props.image.request({
      compressMode: imageCompressMode.jpeg,
      quality: 50,
      frameRate: 10,
    });
    return () => props.image.off(update);
  }, [props.image]);
  return (
    <Card title={`${props.image.member.name}:${props.image.name}`}>
      <div
        ref={imgRef}
        className="w-full h-full overflow-y-auto overflow-x-auto"
      >
        <img
          className="max-w-full max-h-full m-auto"
          src={"data:image/jpeg;base64," + props.image.get().toBase64()}
        />
      </div>
    </Card>
  );
}
