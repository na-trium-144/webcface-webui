import { Card } from "./card";
import { useForceUpdate } from "../libs/forceUpdate";
import {
  RobotModel,
  RobotLink,
  Transform,
  Point,
  Geometry,
  geometryType,
  Canvas3D,
  canvas3DComponentType,
  robotJointType,
} from "webcface";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { multiply, inv } from "mathjs";
import { colorName } from "./viewCard";
import * as THREE from "three";

interface Canvas3DProps {
  canvas3D: Canvas3D;
}
export function Canvas3DCard(props: Canvas3DProps) {
  const hasUpdate = useRef<boolean>(true);
  const [canvasData, setCanvasData] = useState<GeometryObject[]>([]);
  useEffect(() => {
    const dependencies: RobotModel[] = [];
    const update = () => {
      hasUpdate.current = true;
      const canvasData = [];
      for (const c of props.canvas3D.get()) {
        switch (c.type) {
          case canvas3DComponentType.geometry:
            canvasData.push({
              geometry: c.geometry,
              color: c.color,
              origin: c.origin,
            });
            break;
          case canvas3DComponentType.robotModel:
            if (
              dependencies.find(
                (m) =>
                  m.member.name === c.robotModel.member.name &&
                  m.name === c.robotModel.name
              ) == undefined
            ) {
              dependencies.push(c.robotModel);
              c.robotModel.on(update);
            }
            for (const ln of c.robotModel.get()) {
              let jointTf = new Transform();
              if (c.angles.has(ln.joint.name)) {
                const a = c.angles.get(ln.joint.name) || 0;
                switch (ln.joint.type) {
                  case robotJointType.rotational:
                    jointTf = new Transform(
                      [0, 0, 0],
                      [a - ln.joint.angle, 0, 0]
                    );
                    break;
                  case robotJointType.prismatic:
                    jointTf = new Transform(
                      [0, 0, a - ln.joint.angle],
                      [0, 0, 0]
                    );
                    break;
                }
              }
              canvasData.push({
                link: ln,
                geometry: ln.geometry,
                color: ln.color,
                origin: new Transform(
                  multiply(
                    c.origin.tfMatrix,
                    ln.originFromBase.tfMatrix,
                    jointTf.tfMatrix
                  )
                ),
              });
            }
            break;
        }
      }
      setCanvasData(canvasData);
    };
    props.canvas3D.on(update);
    props.canvas3D.request();
    return () => {
      props.canvas3D.off(update);
      for (const m of dependencies) {
        m.off(update);
      }
    };
  }, [props.canvas3D]);
  return (
    <Canvas3DCardImpl
      title={`${props.canvas3D.member.name}:${props.canvas3D.name}`}
      hasUpdate={hasUpdate}
      geometries={canvasData}
    />
  );
}
function CoordText(props: { x: number; y: number; z: number }) {
  return (
    <>
      (<span>{props.x.toPrecision(4)}</span>,
      <span className="pl-1">{props.y.toPrecision(4)}</span>,
      <span className="pl-1">{props.z.toPrecision(4)}</span>)
    </>
  );
}
export interface GeometryObject {
  link?: RobotLink;
  geometry: Geometry;
  color: number;
  origin: Transform;
}
interface Props {
  title: string;
  hasUpdate: { current: boolean };
  geometries: GeometryObject[];
}
export function Canvas3DCardImpl(props: Props) {
  const hasUpdate = props.hasUpdate;
  const update = useForceUpdate();
  useEffect(() => {
    const i = setInterval(() => {
      if (hasUpdate.current) {
        update();
        hasUpdate.current = false;
      }
    }, 50);
    return () => clearInterval(i);
  }, [update, hasUpdate]);

  // デフォルトでは(0, 0, 5)から見下ろしていて、xが右、yが上
  // (1, 1, 1) の方向から見下ろすような図にしたい
  const worldTf = useRef<Transform>(
    new Transform(
      multiply(
        new Transform([0, 0, 0], [0, 0, -Math.PI / 4]).tfMatrix,
        new Transform([0, 0, 0], [(Math.PI * 5) / 4, 0, 0]).tfMatrix
      )
    )
  );
  const [worldScale, setWorldScale] = useState<number>(1);
  const moveSpeed = 0.01 / worldScale;
  const rotateSpeed = 0.01;
  // const scrollSpeed = 0.002 * worldScale;
  const scaleRate = 1.001;

  const [pointerPos, setPointerPos] = useState<THREE.Vector3 | null>(null);
  const [pointerLink, setPointerLink] = useState<RobotLink | null>(null);
  const onPointerMoveOnMesh = (
    o: GeometryObject,
    e: ThreeEvent<MouseEvent>
  ) => {
    const pointerPos = e.intersections[0].point;
    const pointerPosTf = new Transform([
      pointerPos.x / worldScale,
      pointerPos.y / worldScale,
      pointerPos.z / worldScale,
    ]);
    const pointerPosWorld = new Transform(
      multiply(inv(worldTf.current.tfMatrix), pointerPosTf.tfMatrix)
    );
    setPointerPos(new THREE.Vector3(...pointerPosWorld.pos));
    setPointerLink(o.link || null);
    e.stopPropagation();
  };
  return (
    <Card title={props.title}>
      <div className="flex flex-col w-full h-full">
        <Canvas
          className="flex-1 max-h-full"
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
          {props.geometries.map((o, i) => {
            switch (o.geometry.type) {
              case geometryType.line:
                return (
                  <Line
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={o.origin}
                    originToBegin={o.geometry.asLine.begin}
                    originToEnd={o.geometry.asLine.end}
                    color={o.color == 0 ? "gray" : colorName[o.color]}
                    onPointerMove={(e: ThreeEvent<MouseEvent>) =>
                      onPointerMoveOnMesh(o, e)
                    }
                  />
                );
              case geometryType.plane:
                return (
                  <Plane
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={o.origin}
                    center={o.geometry.asPlane.origin}
                    width={o.geometry.asPlane.width}
                    height={o.geometry.asPlane.height}
                    color={o.color == 0 ? "gray" : colorName[o.color]}
                    onPointerMove={(e: ThreeEvent<MouseEvent>) =>
                      onPointerMoveOnMesh(o, e)
                    }
                  />
                );
              case geometryType.box:
                return (
                  <Box
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={o.origin}
                    vertex1={o.geometry.asBox.vertex1}
                    vertex2={o.geometry.asBox.vertex2}
                    color={o.color == 0 ? "gray" : colorName[o.color]}
                    onPointerMove={(e: ThreeEvent<MouseEvent>) =>
                      onPointerMoveOnMesh(o, e)
                    }
                  />
                );
              case geometryType.circle:
                return (
                  <Circle
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={o.origin}
                    center={o.geometry.asCircle.origin}
                    radius={o.geometry.asCircle.radius}
                    color={o.color == 0 ? "gray" : colorName[o.color]}
                    onPointerMove={(e: ThreeEvent<MouseEvent>) =>
                      onPointerMoveOnMesh(o, e)
                    }
                  />
                );
              case geometryType.cylinder:
                return (
                  <Cylinder
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={o.origin}
                    centerBottom={o.geometry.asCylinder.origin}
                    radius={o.geometry.asCylinder.radius}
                    length={o.geometry.asCylinder.length}
                    color={o.color == 0 ? "gray" : colorName[o.color]}
                    onPointerMove={(e: ThreeEvent<MouseEvent>) =>
                      onPointerMoveOnMesh(o, e)
                    }
                  />
                );
              case geometryType.sphere:
                return (
                  <Sphere
                    key={i}
                    worldToBase={worldTf.current}
                    worldScale={worldScale}
                    baseToOrigin={o.origin}
                    center={o.geometry.asSphere.origin}
                    radius={o.geometry.asSphere.radius}
                    color={o.color == 0 ? "gray" : colorName[o.color]}
                    onPointerMove={(e: ThreeEvent<MouseEvent>) =>
                      onPointerMoveOnMesh(o, e)
                    }
                  />
                );
            }
          })}
        </Canvas>
        <div className="flex-none h-4 text-xs">
          {pointerPos !== null && <CoordText {...pointerPos} />}
        </div>
        <div className="flex-none h-4 text-xs">
          {pointerLink !== null && (
            <>
              <span>{pointerLink.name}</span>
              <span className="p-1">/</span>
              <span>{pointerLink.joint.name}</span>
              <span className="pl-1 pr-0.5">angle=</span>
              <span>{pointerLink.joint.angle}</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

interface LinkProps {
  worldToBase: Transform;
  baseToOrigin: Transform;
  worldScale: number;
  color: string;
  onPointerMove: (e: ThreeEvent<MouseEvent>) => void;
}

function transformMesh(props: LinkProps, meshRef: { current: THREE.Mesh }) {
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

function Line(props: LinkProps & { originToBegin: Point; originToEnd: Point }) {
  // 表示用のlineと、raycast用のcylinder(透明)を描画
  const lineRef = useRef<THREE.Line>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  useLayoutEffect(() => {
    lineRef.current.geometry.setFromPoints([
      new THREE.Vector3(...props.originToBegin.pos),
      new THREE.Vector3(...props.originToEnd.pos),
    ]);
    lineRef.current.geometry.verticesNeedUpdate = true;
  }, [props.originToBegin, props.originToEnd]);
  const beginToEnd = [
    props.originToEnd.pos[0] - props.originToBegin.pos[0],
    props.originToEnd.pos[1] - props.originToBegin.pos[1],
    props.originToEnd.pos[2] - props.originToBegin.pos[2],
  ];
  const len = Math.sqrt(
    beginToEnd[0] ** 2 + beginToEnd[1] ** 2 + beginToEnd[2] ** 2
  );
  useFrame(() => {
    transformMesh(props, lineRef);
    transformMesh(
      {
        ...props,
        baseToOrigin: new Transform(
          multiply(
            props.baseToOrigin.tfMatrix,
            new Transform(props.originToBegin.pos, [
              Math.atan2(beginToEnd[1], beginToEnd[0]),
              Math.atan2(
                beginToEnd[2],
                Math.sqrt(beginToEnd[0] ** 2 + beginToEnd[1] ** 2)
              ),
              0,
            ]).tfMatrix,
            new Transform([len / 2, 0, 0], [Math.PI / 2, 0, 0]).tfMatrix
          )
        ),
      },
      meshRef
    );
  });

  return (
    <>
      <line ref={lineRef} scale={props.worldScale}>
        <lineBasicMaterial color={props.color} />
      </line>
      <mesh
        ref={meshRef}
        scale={props.worldScale}
        onPointerMove={props.onPointerMove}
      >
        <cylinderGeometry args={[len / 10, len / 10, len, 8]} />
        <meshStandardMaterial visible={false} />
      </mesh>
    </>
  );
}
// 以降、line以外はどれもだいたい同じ実装

function Plane(
  props: LinkProps & { center: Transform; width: number; height: number }
) {
  const meshRef = useRef();
  useFrame(() =>
    transformMesh(
      {
        ...props,
        baseToOrigin: new Transform(
          multiply(props.baseToOrigin.tfMatrix, props.center.tfMatrix)
        ),
      },
      meshRef
    )
  );

  return (
    <mesh
      ref={meshRef}
      scale={props.worldScale}
      onPointerMove={props.onPointerMove}
    >
      <planeGeometry args={[props.width, props.height]} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}
function Box(props: LinkProps & { vertex1: Point; vertex2: Point }) {
  const meshRef = useRef();
  const center = new Transform([
    (props.vertex1.pos[0] + props.vertex2.pos[0]) / 2,
    (props.vertex1.pos[1] + props.vertex2.pos[1]) / 2,
    (props.vertex1.pos[2] + props.vertex2.pos[2]) / 2,
  ]);
  const size = [
    Math.abs(props.vertex1.pos[0] - props.vertex2.pos[0]),
    Math.abs(props.vertex1.pos[1] - props.vertex2.pos[1]),
    Math.abs(props.vertex1.pos[2] - props.vertex2.pos[2]),
  ];
  useFrame(() =>
    transformMesh(
      {
        ...props,
        baseToOrigin: new Transform(
          multiply(props.baseToOrigin.tfMatrix, center.tfMatrix)
        ),
      },
      meshRef
    )
  );

  return (
    <mesh
      ref={meshRef}
      scale={props.worldScale}
      onPointerMove={props.onPointerMove}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}
function Circle(props: LinkProps & { center: Transform; radius: number }) {
  const meshRef = useRef();
  useFrame(() =>
    transformMesh(
      {
        ...props,
        baseToOrigin: new Transform(
          multiply(props.baseToOrigin.tfMatrix, props.center.tfMatrix)
        ),
      },
      meshRef
    )
  );

  return (
    <mesh
      ref={meshRef}
      scale={props.worldScale}
      onPointerMove={props.onPointerMove}
    >
      <circleGeometry args={[props.radius]} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}

function Cylinder(
  props: LinkProps & { centerBottom: Transform; radius: number; length: number }
) {
  const meshRef = useRef();
  useFrame(() =>
    transformMesh(
      {
        ...props,
        baseToOrigin: new Transform(
          multiply(
            props.baseToOrigin.tfMatrix,
            props.centerBottom.tfMatrix,
            new Transform([props.length / 2, 0, 0], [Math.PI / 2, 0, 0])
              .tfMatrix
          )
        ),
      },
      meshRef
    )
  );

  return (
    <mesh
      ref={meshRef}
      scale={props.worldScale}
      onPointerMove={props.onPointerMove}
    >
      <cylinderGeometry args={[props.radius, props.radius, props.length]} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}

function Sphere(props: LinkProps & { center: Point; radius: number }) {
  const meshRef = useRef();
  useFrame(() =>
    transformMesh(
      {
        ...props,
        baseToOrigin: new Transform(
          multiply(
            props.baseToOrigin.tfMatrix,
            new Transform(props.center.pos).tfMatrix
          )
        ),
      },
      meshRef
    )
  );

  return (
    <mesh
      ref={meshRef}
      scale={props.worldScale}
      onPointerMove={props.onPointerMove}
    >
      <sphereGeometry args={[props.radius]} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  );
}
