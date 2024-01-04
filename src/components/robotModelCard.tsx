import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import { RobotModel, RobotLink, Transform, robotGeometryType } from "webcface";
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

  // デフォルトでは(0, 0, 5)から見下ろしていて、xが右、yが上
  // (1, 1, 1) の方向から見下ろすような図にしたい
  const worldTf = useRef<Transform>(new Transform(multiply(
    new Transform([0, 0, 0], [0, 0, -Math.PI / 4]).tfMatrix,
    new Transform([0, 0, 0], [Math.PI * 5 / 4, 0, 0]).tfMatrix,
  )));
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
              worldTf.current.pos[0] += e.movementX * moveSpeed;
              worldTf.current.pos[1] += -e.movementY * moveSpeed;
            } else if (e.buttons & 1) {
              worldTf.current.tfMatrix = multiply(
                new Transform(
                  [0, 0, 0],
                  [0, e.movementX * rotateSpeed, e.movementY * rotateSpeed]
                ).tfMatrix,
                worldTf.current.tfMatrix
              );
            }
          }}
          onWheel={(e) => {
            setWorldScale(worldScale * scaleRate ** -e.deltaY);
            // worldTf.current.pos[0] += -e.deltaY * scrollSpeed;
          }}
        >
          <ambientLight intensity={Math.PI / 2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            decay={0}
            intensity={Math.PI / 4}
          />
          <pointLight
            position={[-10, -10, -10]}
            decay={0}
            intensity={Math.PI / 4}
          />
          {props.robotModel.get().map((ln, i) => {
            switch (ln.geometry.type) {
              case robotGeometryType.line:
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
              case robotGeometryType.plane:
                return (
                  <Plane
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={ln.geometry.origin}
                    width={ln.geometry.asPlane.width}
                    height={ln.geometry.asPlane.height}
                    color={ln.color == 0 ? "gray" : colorName[ln.color]}
                  />
                );
              case robotGeometryType.box:
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

function transformMesh(props: LinkProps, meshRef: { current: any }) {
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
  useFrame((state, delta) => transformMesh(props, meshRef));
  return (
    <line ref={meshRef} scale={props.worldScale}>
      <lineBasicMaterial color={props.color} />
    </line>
  );
}

function Plane(props: LinkProps & { width: number; height: number }) {
  const meshRef = useRef();
  useFrame((state, delta) => transformMesh(props, meshRef));

  return (
    <mesh ref={meshRef} scale={props.worldScale}>
      <planeGeometry args={[props.width, props.height]} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}

function Box(props: LinkProps & { boxSize: number[] }) {
  const meshRef = useRef();
  useFrame((state, delta) => transformMesh(props, meshRef));

  return (
    <mesh ref={meshRef} scale={props.worldScale}>
      <boxGeometry args={props.boxSize} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}
