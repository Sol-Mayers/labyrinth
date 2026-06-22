import { OrbitControls } from "@react-three/drei";
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
}

function Experience({
  labyrinth,
  mode,
  setSprintEnergy,
  patchDensity = 0.02,
}: ExperienceProps) {
  const [isInsideHouse, setIsInsideHouse] = useState(false);
  const cellSize = 3;
  const wallHeight = 4.2;
  const viewRadius = 21; // Тот самый радиус в метрах
  const fogDensity = 2.1 / viewRadius;

  // Храним позицию игрока для фильтрации окружения
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

  return (
    <>
      <SceneLights
        worldWidth={world.width}
        worldDepth={world.depth}
        playerPos={playerPos}
        mode={mode}
        viewRadius={viewRadius}
      />

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
            onPositionChange={setPlayerPos} // Передаем колбэк
            isInsideHouse={isInsideHouse}
          />
        </>
      )}

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
      <House onToggleSlowdown={setIsInsideHouse} />
    </>
  );
}

export default memo(Experience);
