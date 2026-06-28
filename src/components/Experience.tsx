import { OrbitControls, Html } from "@react-three/drei";
import {
  memo,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import SceneLights from "./SceneLights";
import Floor from "./sceneFragments/Floor/Floor";
import Walls from "./sceneFragments/Walls/Walls";
import FPSController from "./Player/Player";
import * as THREE from "three";
import Fog from "./sceneFragments/Fog/Fog";
import House from "./sceneFragments/House/House";

interface ExperienceProps {
  labyrinth: number[][];
  mode: "orbit" | "fps";
  setSprintEnergy: Dispatch<SetStateAction<number>>;
  patchDensity?: number;
  fade: number;
  setFade: Dispatch<SetStateAction<number>>;
}

function Experience({
  labyrinth,
  mode,
  setSprintEnergy,
  patchDensity = 0.02,
  fade,
  setFade,
}: ExperienceProps) {
  const [isInsideHouse, setIsInsideHouse] = useState(false);
  const [roofAction, setRoofAction] = useState<"up" | "down" | null>(null);
  const [movementLocked, setMovementLocked] = useState(false);
  const [teleportPosition, setTeleportPosition] = useState<
    [number, number, number] | undefined
  >(undefined);

  const cellSize = 3;
  const wallHeight = 4.2;
  const viewRadius = 21;
  const fogDensity = 2.1 / viewRadius;

  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 0, 0));

  const world = useMemo(() => {
    const rows = labyrinth.length;
    const cols = labyrinth[0]?.length ?? 0;
    const width = cols * cellSize;
    const depth = rows * cellSize;
    const originX = -width / 2 + cellSize / 2;
    const originZ = -depth / 2 + cellSize / 2;

    return { rows, cols, width, depth, originX, originZ, cellSize, wallHeight };
  }, [labyrinth]);

  const handleRoofMoveRequest = (action: "up" | "down") => {
    if (movementLocked) return;

    setMovementLocked(true);
    setFade(1);

    window.setTimeout(() => {
      if (action === "up") {
        setTeleportPosition([-0.5, 6, -6.37]);
      } else {
        setTeleportPosition([-1.6, 3.7, -6.37]);
      }

      window.setTimeout(() => {
        setFade(0);

        window.setTimeout(() => {
          setMovementLocked(false);
        }, 300);
      }, 150);
    }, 800);
  };

  return (
    <>
      {mode === "orbit" ? (
        <OrbitControls />
      ) : (
        <>
          <Fog color="#a1a1a1" density={fogDensity} />

          <FPSController
            labyrinth={labyrinth}
            cellSize={world.cellSize}
            originX={world.originX - 5}
            originZ={world.originZ}
            onSprintEnergyChange={setSprintEnergy}
            onPositionChange={setPlayerPos}
            isInsideHouse={isInsideHouse || movementLocked}
            movementLocked={movementLocked}
            onRoofMoveRequest={handleRoofMoveRequest}
            roofAction={roofAction}
            position={teleportPosition}
          />

          {roofAction ? (
            <Html
              center
              position={[-1.4, 4.15, -6.37]}
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 700,
                  fontFamily: "'Exo 2', 'Rajdhani', sans-serif",
                  textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                  whiteSpace: "nowrap",
                  opacity: fade > 0 ? 0 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                {roofAction === "up"
                  ? "Забраться на крышу (E)"
                  : "Спуститься в дом (E)"}
              </div>
            </Html>
          ) : null}
        </>
      )}

      <House
        onToggleSlowdown={setIsInsideHouse}
        onRoofActionChange={setRoofAction}
        onRoofMoveRequest={handleRoofMoveRequest}
      />

      <SceneLights
        worldWidth={world.width}
        worldDepth={world.depth}
        playerPos={playerPos}
        mode={mode}
        viewRadius={viewRadius}
      />

      <Floor
        labyrinth={labyrinth}
        cellSize={world.cellSize}
        playerPos={playerPos}
        viewRadius={viewRadius}
        mode={mode}
      />

      <Walls
        labyrinth={labyrinth}
        cellSize={world.cellSize}
        wallHeight={world.wallHeight}
        playerPos={playerPos}
        viewRadius={viewRadius}
        mode={mode}
      />
    </>
  );
}

export default memo(Experience);