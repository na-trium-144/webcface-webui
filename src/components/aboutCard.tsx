import { Card } from "./card";
// import { useForceUpdate } from "../libs/forceUpdate";
import {Versions} from "../libs/serverVersions"
interface Props {
}
export function AboutCard(props: Props) {
  const versions = window.versions as (Versions | undefined);

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
            <span className="pl-1">{versions?.node()}</span>
          </p>
          <p className="text-sm flex items-center">
            <span className="">Chrome:</span>
            <span className="pl-1">{versions?.chrome()}</span>
          </p>
          <p className="text-sm flex items-center">
            <span className="">Electron:</span>
            <span className="pl-1">{versions?.electron()}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
