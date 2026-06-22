import { memo, useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SceneLightsProps {
  worldWidth: number;
  worldDepth: number;
  playerPos: THREE.Vector3;
  mode: "orbit" | "fps";
  viewRadius: number;
}

function SceneLights({
  worldWidth,
  worldDepth,
  playerPos,
  mode,
  viewRadius,
}: SceneLightsProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null!);

  const maxSide = Math.max(worldWidth, worldDepth);

  const shadowHalf = useMemo(() => {
    return mode === "fps" ? viewRadius * 1.2 : maxSide * 0.15;
  }, [mode, viewRadius, maxSide]);

  const lightPosition = useMemo(
    () => [20, 30, 15] as [number, number, number],
    [],
  );

  useEffect(() => {
    if (!lightRef.current) return;

    const light = lightRef.current;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
  }, []);

  useFrame(() => {
    if (!lightRef.current) return;

    if (mode === "fps") {
      lightRef.current.position.set(
        playerPos.x + 20,
        playerPos.y + 30,
        playerPos.z + 15,
      );

      lightRef.current.target.position.set(
        playerPos.x,
        playerPos.y,
        playerPos.z,
      );
      lightRef.current.target.updateMatrixWorld();

      const cam = lightRef.current.shadow.camera as THREE.OrthographicCamera;
      cam.left = -shadowHalf;
      cam.right = shadowHalf;
      cam.top = shadowHalf;
      cam.bottom = -shadowHalf;
      cam.near = 1;
      cam.far = 150;
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />

      <directionalLight
        ref={lightRef}
        position={lightPosition}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-camera-left={-shadowHalf}
        shadow-camera-right={shadowHalf}
        shadow-camera-top={shadowHalf}
        shadow-camera-bottom={-shadowHalf}
        shadow-bias={0.0001}
        shadow-normalBias={0.04}
        shadow-radius={3}
      />

      {/* <pointLight position={[0, 12, 0]} intensity={25} /> */}
    </>
  );
}

export default memo(SceneLights);
