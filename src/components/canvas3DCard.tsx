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
} from "webcface";
import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  RefObject,
  PointerEvent as ReactPointerEvent,
} from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { multiply, inv } from "../libs/math";
import { colorName } from "../libs/color";
import * as THREE from "three";
import { IconButton } from "./button";
import { iconFillColor } from "./sideMenu";
import { Move, Home, Help } from "@icon-park/react";
import { CaptionBox } from "./caption";
import { useLayoutChange } from "./layoutChangeProvider";

interface Canvas3DProps {
  canvas3D: Canvas3D;
}
export function Canvas3DCard(props: Canvas3DProps) {
  const { layoutChanging } = useLayoutChange();
  const hasUpdate = useRef<boolean>(true);
  const [canvasData, setCanvasData] = useState<GeometryObject[]>([]);
  useEffect(() => {
    if (!layoutChanging) {
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
                canvasData.push({
                  link: ln,
                  geometry: ln.geometry,
                  color: ln.color,
                  origin: new Transform(
                    multiply(
                      c.origin.tfMatrix,
                      ln.getOriginFromBase(c.angles).tfMatrix
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
    }
  }, [layoutChanging, props.canvas3D]);
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
  const canvasMain = useRef<HTMLCanvasElement>(null);
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
  const defaultTf = () =>
    new Transform(
      multiply(
        new Transform([0, 0, 0], [0, 0, -Math.PI / 4]).tfMatrix,
        new Transform([0, 0, 0], [(Math.PI * 5) / 4, 0, 0]).tfMatrix
      )
    );
  const worldTf = useRef<Transform>(defaultTf());
  const [worldScale, setWorldScale] = useState<number>(1);
  const moveSpeed = 0.01 / worldScale;
  const rotateSpeed = 0.01;
  // const scrollSpeed = 0.002 * worldScale;
  const scaleRate = 1.001;
  const pointers = useRef<ReactPointerEvent[]>([]);
  const prevPointerDistance = useRef<number | null>(null);
  const [moveEnabled, setMoveEnabled] = useState<boolean>(false);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (
      pointers.current.filter((p) => p.pointerId === e.pointerId).length === 0
    ) {
      pointers.current.push(e);
    }
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current = pointers.current.filter(
      (p) => p.pointerId !== e.pointerId
    );
    prevPointerDistance.current = null;
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (pointers.current.length <= 1) {
      if (
        moveEnabled &&
        ((e.buttons & 1 && (e.ctrlKey || e.metaKey)) || e.buttons & 4)
      ) {
        worldTf.current.pos[0] += e.movementX * moveSpeed;
        worldTf.current.pos[1] += -e.movementY * moveSpeed;
      } else if (moveEnabled && e.buttons & 1) {
        worldTf.current.tfMatrix = multiply(
          new Transform(
            [0, 0, 0],
            [0, e.movementX * rotateSpeed, e.movementY * rotateSpeed]
          ).tfMatrix,
          worldTf.current.tfMatrix
        );
      }
    } else if (moveEnabled && pointers.current.length === 2) {
      worldTf.current.pos[0] += (e.movementX * moveSpeed) / 2;
      worldTf.current.pos[1] += (-e.movementY * moveSpeed) / 2;

      pointers.current = pointers.current.map((p) =>
        p.pointerId === e.pointerId ? e : p
      );
      const newDiff = {
        x: pointers.current[0].clientX - pointers.current[1].clientX,
        y: pointers.current[0].clientY - pointers.current[1].clientY,
      };
      const newDist = Math.sqrt(newDiff.x * newDiff.x + newDiff.y * newDiff.y);
      let distChange = 1;
      if (prevPointerDistance.current !== null) {
        distChange = newDist / prevPointerDistance.current;
      }
      prevPointerDistance.current = newDist;
      setWorldScale(worldScale * distChange ** 1.2);
    }
  };
  const onWheel = (e: WheelEvent) => {
    if (moveEnabled) {
      setWorldScale(worldScale * scaleRate ** -e.deltaY);
      // worldTf.current.pos[0] += -e.deltaY * scrollSpeed;
      e.preventDefault();
    }
  };
  useEffect(() => {
    const canvasMainCurrent = canvasMain.current;
    if (canvasMainCurrent) {
      canvasMainCurrent.addEventListener("wheel", onWheel, {
        passive: false,
      });
      return () => canvasMainCurrent.removeEventListener("wheel", onWheel);
    }
  });

  const [pointerPos, setPointerPos] = useState<THREE.Vector3 | null>(null);
  const [pointerLink, setPointerLink] = useState<RobotLink | null>(null);
  const onPointerMoveOnMesh = (
    o: GeometryObject,
    e: ThreeEvent<PointerEvent>
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
          style={{
            touchAction: moveEnabled ? "none" : "auto",
            cursor: moveEnabled ? "grab" : "default",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          ref={canvasMain}
          camera={{ fov: 30, near: 0.1, far: 1000, position: [0, 0, 5] }}
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
          {props.geometries.map((o, i) => (
            <Link
              key={i}
              geometry={o}
              onPointerMoveOnMesh={onPointerMoveOnMesh}
              worldTf={worldTf}
              worldScale={worldScale}
            />
          ))}
        </Canvas>
        <div className="flex-none h-8 text-xs flex items-center ">
          <div className="flex-1 flex flex-col">
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
          <div className="flex-none text-lg relative">
            <IconButton
              onClick={() => setMoveEnabled(!moveEnabled)}
              caption="Canvasの移動・ズーム オン/オフ"
            >
              {moveEnabled ? (
                <Move theme="two-tone" fill={iconFillColor} />
              ) : (
                <Move />
              )}
            </IconButton>
            <IconButton
              onClick={() => {
                worldTf.current = defaultTf();
                setWorldScale(1);
              }}
              caption="初期位置に戻す"
            >
              <Home />
            </IconButton>
            <IconButton className="mr-4 peer" onClick={() => undefined}>
              <Help />
            </IconButton>
            <CaptionBox
              className={
                "absolute bottom-full right-4 " +
                "hidden peer-hover:inline-block peer-focus:inline-block "
              }
            >
              <p>移動・ズームがオンのとき、</p>
              <p>(マウス)ドラッグ / (タッチ)スライド で回転、</p>
              <p>(マウス)Ctrl(Command⌘)+ドラッグ or</p>
              <p>ホイールクリックしながらドラッグ</p>
              <p> / (タッチ)2本指スライド で移動、</p>
              <p>(マウス)スクロール / (タッチ)2本指操作 で</p>
              <p>拡大縮小できます。</p>
            </CaptionBox>
          </div>
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
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
}

function transformMesh(
  props: LinkProps,
  meshRef: RefObject<THREE.Mesh | THREE.Line>
) {
  if (meshRef.current != null) {
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
}

interface linkProps2 {
  geometry: GeometryObject;
  onPointerMoveOnMesh: (o: GeometryObject, e: ThreeEvent<PointerEvent>) => void;
  worldTf: { current: Transform };
  worldScale: number;
}
function Link(props: linkProps2) {
  const linkProps = {
    worldToBase: props.worldTf.current,
    worldScale: props.worldScale,
    baseToOrigin: props.geometry.origin,
    color: props.geometry.color == 0 ? "gray" : colorName[props.geometry.color],
    onPointerMove: (e: ThreeEvent<PointerEvent>) =>
      props.onPointerMoveOnMesh(props.geometry, e),
  };
  switch (props.geometry.geometry.type) {
    case geometryType.line:
      return (
        <Line
          {...linkProps}
          originToBegin={props.geometry.geometry.asLine.begin}
          originToEnd={props.geometry.geometry.asLine.end}
        />
      );
    case geometryType.plane:
      return (
        <Plane
          {...linkProps}
          center={props.geometry.geometry.asPlane.origin}
          width={props.geometry.geometry.asPlane.width}
          height={props.geometry.geometry.asPlane.height}
        />
      );
    case geometryType.box:
      return (
        <Box
          {...linkProps}
          vertex1={props.geometry.geometry.asBox.vertex1}
          vertex2={props.geometry.geometry.asBox.vertex2}
        />
      );
    case geometryType.circle:
      return (
        <Circle
          {...linkProps}
          center={props.geometry.geometry.asCircle.origin}
          radius={props.geometry.geometry.asCircle.radius}
        />
      );
    case geometryType.cylinder:
      return (
        <Cylinder
          {...linkProps}
          centerBottom={props.geometry.geometry.asCylinder.origin}
          radius={props.geometry.geometry.asCylinder.radius}
          length={props.geometry.geometry.asCylinder.length}
        />
      );
    case geometryType.sphere:
      return (
        <Sphere
          {...linkProps}
          center={props.geometry.geometry.asSphere.origin}
          radius={props.geometry.geometry.asSphere.radius}
        />
      );
  }
}

function Line(props: LinkProps & { originToBegin: Point; originToEnd: Point }) {
  // 表示用のlineと、raycast用のcylinder(透明)を描画
  const lineRef = useRef<THREE.Line>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => {
    lineRef.current?.geometry.setFromPoints([
      new THREE.Vector3(...props.originToBegin.pos),
      new THREE.Vector3(...props.originToEnd.pos),
    ]);
    // lineRef.current.geometry.verticesNeedUpdate = true;
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
      <line
        ref={lineRef as unknown as RefObject<SVGLineElement>}
        scale={props.worldScale}
      >
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
  const meshRef = useRef<THREE.Mesh>(null);
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
  const meshRef = useRef<THREE.Mesh>(null);
  const center = new Transform([
    (props.vertex1.pos[0] + props.vertex2.pos[0]) / 2,
    (props.vertex1.pos[1] + props.vertex2.pos[1]) / 2,
    (props.vertex1.pos[2] + props.vertex2.pos[2]) / 2,
  ]);
  const size: [number, number, number] = [
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
  const meshRef = useRef<THREE.Mesh>(null);
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
  const meshRef = useRef<THREE.Mesh>(null);
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
  const meshRef = useRef<THREE.Mesh>(null);
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
