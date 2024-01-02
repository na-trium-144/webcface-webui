import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { RobotModel, RobotLink, Transform } from "webcface";
import { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { multiply } from "mathjs";

interface Props {
  robotModel: RobotModel;
}
export function RobotModelCard(props: Props) {
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
  }, [props.robotModel, update]);
  useEffect(() => {
    const update = () => {
      hasUpdate.current = true;
    };
    props.robotModel.on(update);
    props.robotModel.request();
    return () => props.robotModel.off(update);
  }, [props.robotModel]);

  const [worldTf, setWorldTf] = useState<Transform>(
    new Transform([0, 0, 0], [0, 0, 0])
  );
  const [mouse, setMouse] = useState<boolean>(false);

  return (
    <Card title={`${props.robotModel.name}:${props.robotModel.name}`}>
      <div className="w-full h-full">
        <Canvas
          onMouseDown={() => setMouse(true)}
          onMouseUp={() => setMouse(false)}
          onMouseMove={(e) => {
            if (mouse) {
              moveX(-e.movementX / 100);
              moveY(e.movementY / 100);
            }
          }}
          onWheel={(e) => zoom(e.deltaY)}
        >
          <ambientLight intensity={Math.PI / 2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            decay={0}
            intensity={Math.PI}
          />
          <pointLight
            position={[-10, -10, -10]}
            decay={0}
            intensity={Math.PI}
          />
          <Box
            worldToBase={worldTf}
            baseToOrigin={new Transform([0, 0, 0], [0, 0, 0])}
            color="yellow"
          />
        </Canvas>
      </div>
    </Card>
  );
}

interface LinkProps {
  worldToBase: Transform;
  baseToOrigin: Transform;
  color: string;
}

function Box(props: LinkProps & { boxSize: number[] }) {
  const meshRef = useRef();
  useFrame((state, delta) => {
    const meshTf = multiply(
      props.worldToBase.tfMatrix,
      props.baseToOrigin.tfMatrix
    );
    const meshPos = new Transform(
      [meshTf[0][3], meshTf[1][3], meshTf[2][3]],
      [meshTf[0].slice(0, 3), meshTf[1].slice(0, 3), meshTf[2].slice(0, 3)]
    );
    meshRef.current.position.x = meshPos.pos[0];
    meshRef.current.position.y = meshPos.pos[1];
    meshRef.current.position.z = meshPos.pos[2];
    meshRef.current.rotation.z = meshPos.rot[0];
    meshRef.current.rotation.y = meshPos.rot[1];
    meshRef.current.rotation.x = meshPos.rot[2];
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={props.boxSize} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}
