import { Card } from "./card";
import "../../renderer.d.ts";

// import { useForceUpdate } from "../libs/forceUpdate";
export function AboutCard(/*props: Props*/) {
  // const update = useForceUpdate();
  // useEffect(() => {
  //   const i = setInterval(update, 100);
  //   return () => clearInterval(i);
  // }, [update]);
  return (
    <Card title={`About`}>
      <div className="w-full h-full overflow-auto">
        <div className="w-max">
          <p className="text-sm flex items-center">
            <span className="">Node.js:</span>
            <span className="pl-1">{window.electronAPI?.versions.node()}</span>
          </p>
          <p className="text-sm flex items-center">
            <span className="">Chrome:</span>
            <span className="pl-1">
              {window.electronAPI?.versions.chrome()}
            </span>
          </p>
          <p className="text-sm flex items-center">
            <span className="">Electron:</span>
            <span className="pl-1">
              {window.electronAPI?.versions.electron()}
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}
