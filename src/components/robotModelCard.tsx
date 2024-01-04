import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { RobotModel, RobotLink, Transform } from "webcface";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { multiply } from "mathjs";
import { colorName } from "./viewCard";
import * as THREE from "three";

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

  const worldTf = useRef<Transform>(new Transform([0, 0, 0], [0, 0, 0]));
  const [worldScale, setWorldScale] = useState<number>(1);
  const moveSpeed = 0.01;
  const rotateSpeed = 0.01;
  // const scrollSpeed = 0.002;
  const scaleRate = 1.001;

  return (
    <Card title={`${props.robotModel.member.name}:${props.robotModel.name}`}>
      <div className="w-full h-full">
        <Canvas
          onMouseMove={(e) => {
            if ((e.buttons & 1 && e.ctrlKey) || e.buttons & 4) {
              worldTf.current.pos[2] += -e.movementX * moveSpeed;
              worldTf.current.pos[1] += -e.movementY * moveSpeed;
            } else if (e.buttons & 1) {
              worldTf.current.tfMatrix = multiply(
                new Transform(
                  [0, 0, 0],
                  [-e.movementY * rotateSpeed, e.movementX * rotateSpeed, 0]
                ).tfMatrix,
                worldTf.current.tfMatrix
              );
            }
          }}
          onWheel={(e) => {
            setWorldScale(worldScale * scaleRate ** -e.deltaY);
            // worldTf.current.pos[0] += -e.deltaY * scrollSpeed;
          }}
          camera={{ fov: 75, near: 0.1, far: 1000, position: [5, 0, 0] }}
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
          {props.robotModel.get().map((ln, i) => {
            switch (ln.geometry.type) {
              case 1:
                return (
                  <Line
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={
                      new Transform(
                        multiply(
                          ln.originFromBase.tfMatrix,
                          ln.geometry.origin.tfMatrix
                        )
                      )
                    }
                    originToEnd={ln.geometry.asLine.end}
                    color={ln.color == 0 ? "gray" : colorName[ln.color]}
                  />
                );

              case 3:
                return (
                  <Box
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={ln.geometry.origin}
                    color={ln.color == 0 ? "gray" : colorName[ln.color]}
                  />
                );
            }
          })}
        </Canvas>
      </div>
    </Card>
  );
}

interface LinkProps {
  worldToBase: Transform;
  baseToOrigin: Transform;
  worldScale: number;
  color: string;
}

function Line(props: LinkProps & { originToEnd: Transform }) {
  const meshRef = useRef();
  useLayoutEffect(() => {
    meshRef.current.geometry.setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...props.originToEnd.pos),
    ]);
    meshRef.current.geometry.verticesNeedUpdate = true;
  }, [props.originToEnd]);
  useFrame((state, delta) => {
    const meshPos = new Transform(
      multiply(props.worldToBase.tfMatrix, props.baseToOrigin.tfMatrix)
    );
    meshRef.current.position.x = meshPos.pos[0] * props.worldScale;
    meshRef.current.position.y = meshPos.pos[1] * props.worldScale;
    meshRef.current.position.z = meshPos.pos[2] * props.worldScale;
    meshRef.current.rotation.order = "ZYX";
    meshRef.current.rotation.z = meshPos.rot[0];
    meshRef.current.rotation.y = meshPos.rot[1];
    meshRef.current.rotation.x = meshPos.rot[2];
  });
  return (
    <line ref={meshRef} scale={props.worldScale}>
      <lineBasicMaterial color={props.color} />
    </line>
  );
}

function Box(props: LinkProps & { boxSize: number[] }) {
  const meshRef = useRef();
  useFrame((state, delta) => {
    const meshPos = new Transform(
      multiply(props.worldToBase.tfMatrix, props.baseToOrigin.tfMatrix)
    );
    meshRef.current.position.x = meshPos.pos[0] * props.worldScale;
    meshRef.current.position.y = meshPos.pos[1] * props.worldScale;
    meshRef.current.position.z = meshPos.pos[2] * props.worldScale;
    meshRef.current.rotation.order = "ZYX";
    meshRef.current.rotation.z = meshPos.rot[0];
    meshRef.current.rotation.y = meshPos.rot[1];
    meshRef.current.rotation.x = meshPos.rot[2];
    // meshRef.current.rotation.x += delta;
    // meshRef.current.rotation.z += delta;
  });

  return (
    <mesh ref={meshRef} scale={props.worldScale}>
      <boxGeometry args={props.boxSize} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}
