import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import Gates from "../Gates/Gates";

interface WallRect {
  sizeX: number;
  sizeZ: number;
  x: number;
  z: number;
  isGate?: boolean;
  key: string;
  textureIndex: number;
}

interface WallsProps {
  labyrinth: number[][];
  cellSize: number;
  wallHeight: number;
  playerPos: THREE.Vector3;
  viewRadius: number;
  mode: "orbit" | "fps";
}

const textureLoader = new THREE.TextureLoader();
const MAX_ANISOTROPY = 8;

function setupTexture(texture: THREE.Texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = MAX_ANISOTROPY;
  texture.needsUpdate = true;
  return texture;
}

const createWallMaterials = (path: string) => {
  const sideMaterial = new THREE.MeshStandardMaterial({
    map: setupTexture(textureLoader.load(`${path}.jpg`)),
    normalMap: setupTexture(textureLoader.load(`${path}_normal.jpg`)),
    aoMap: setupTexture(textureLoader.load(`${path}_ambient.jpg`)),
    color: "#d2d2af",
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 1.0,
    metalness: 0.0,
  });

  const topMaterial = new THREE.MeshStandardMaterial({
    color: "#796d43",
    roughness: 1.0,
    metalness: 0.0,
  });

  return [
    sideMaterial,
    sideMaterial,
    topMaterial,
    topMaterial,
    sideMaterial,
    sideMaterial,
  ];
};

const wallMaterialsGroups = [
  createWallMaterials("/textures/walls/wallFinal1"),
  createWallMaterials("/textures/walls/wallFinal2"),
  createWallMaterials("/textures/walls/wallFinal3"),
];

const gateMaterial = new THREE.MeshStandardMaterial({
  map: setupTexture(textureLoader.load("/textures/walls/wallFinal2.jpg")),
  normalMap: setupTexture(
    textureLoader.load("/textures/walls/wallFinal2_normal.jpg"),
  ),
  aoMap: setupTexture(
    textureLoader.load("/textures/walls/wallFinal2_ambient.jpg"),
  ),
  color: "#d2d2af",
  normalScale: new THREE.Vector2(0.8, 0.8),
  roughness: 1.0,
  metalness: 0.0,
});

const gateTopMaterial = new THREE.MeshStandardMaterial({
  color: "#796d43",
  roughness: 1.0,
  metalness: 0.0,
});

const gateTopWallMap = setupTexture(
  textureLoader.load("/textures/walls/wallFinal1.jpg"),
);
const gateTopWallNormalMap = setupTexture(
  textureLoader.load("/textures/walls/wallFinal1_normal.jpg"),
);
const gateTopWallAoMap = setupTexture(
  textureLoader.load("/textures/walls/wallFinal1_ambient.jpg"),
);

const gateTopWallMaterial = new THREE.MeshStandardMaterial({
  map: gateTopWallMap,
  normalMap: gateTopWallNormalMap,
  aoMap: gateTopWallAoMap,
  color: "#d2d2af",
  normalScale: new THREE.Vector2(0.8, 0.8),
  roughness: 1.0,
  metalness: 0.0,
});

const lintelMaterials = [
  gateTopWallMaterial,
  gateTopWallMaterial,
  gateTopMaterial,
  gateTopMaterial,
  gateTopWallMaterial,
  gateTopWallMaterial,
];

function Walls({
  labyrinth,
  cellSize = 3,
  wallHeight = 4,
  playerPos,
  viewRadius,
  mode,
}: WallsProps) {
  const GATE_WIDTH = 2.3;
  const GATE_OPENING_HEIGHT = 2.5;

  const wallRefs = useRef<Array<THREE.InstancedMesh | null>>([]);

  const { walls, entrancePos, exitPos } = useMemo(() => {
    const rows = labyrinth.length;
    const cols = labyrinth[0]?.length || 0;
    const originX = -((cols * cellSize) / 2) + cellSize / 2;
    const originZ = -((rows * cellSize) / 2) + cellSize / 2;

    const rects: WallRect[] = [];
    let entrance: [number, number, number] | null = null;
    let exit: [number, number, number] | null = null;
    const gateOffset = cellSize * 0.4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = originX + c * cellSize;
        const z = originZ + r * cellSize;

        if (labyrinth[r][c] === 0) {
          if (c === 0 || c === cols - 1) {
            if (c === 0) entrance = [x + gateOffset, 0, z];
            else exit = [x - gateOffset, 0, z];

            rects.push({
              sizeX: cellSize,
              sizeZ: cellSize,
              x,
              z,
              isGate: true,
              key: `gate-${r}-${c}`,
              textureIndex: 0,
            });
          }
          continue;
        }

        rects.push({
          sizeX: cellSize,
          sizeZ: cellSize,
          x,
          z,
          key: `wall-${r}-${c}`,
          textureIndex: (r + c) % 3,
        });
      }
    }

    return { walls: rects, entrancePos: entrance, exitPos: exit };
  }, [labyrinth, cellSize]);

  const visibleWallsData = useMemo(() => {
    if (mode === "orbit") return walls;
    const rSq = Math.pow(viewRadius + cellSize * 1.5, 2);

    return walls.filter((w) => {
      const dx = w.x - playerPos.x;
      const dz = w.z - playerPos.z;
      return dx * dx + dz * dz < rSq;
    });
  }, [walls, playerPos, viewRadius, mode, cellSize]);

  const visibleWallGroups = useMemo(() => {
    const groups: WallRect[][] = [[], [], []];
    for (const wall of visibleWallsData) {
      if (!wall.isGate) {
        groups[wall.textureIndex].push(wall);
      }
    }
    return groups;
  }, [visibleWallsData]);

  const visibleGateWalls = useMemo(
    () => visibleWallsData.filter((w) => w.isGate),
    [visibleWallsData],
  );

  const boxGeom = useMemo(
    () => new THREE.BoxGeometry(cellSize, wallHeight, cellSize),
    [cellSize, wallHeight],
  );

  const gatePartGeometries = useMemo(() => {
    const sidePartDepth = (cellSize - GATE_WIDTH) / 2;
    const lintelHeight = wallHeight - GATE_OPENING_HEIGHT;
    return {
      side: new THREE.BoxGeometry(cellSize, wallHeight, sidePartDepth),
      top: new THREE.BoxGeometry(cellSize, lintelHeight, GATE_WIDTH),
    };
  }, [cellSize, wallHeight]);

  const gateSideMaterials = useMemo(
    () => [
      gateMaterial,
      gateMaterial,
      gateTopMaterial,
      gateTopMaterial,
      gateMaterial,
      gateMaterial,
    ],
    [],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    visibleWallGroups.forEach((group, textureIndex) => {
      const mesh = wallRefs.current[textureIndex];
      if (!mesh) return;

      group.forEach((wall, i) => {
        dummy.position.set(wall.x, wallHeight / 2, wall.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });

      mesh.count = group.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    });
  }, [visibleWallGroups, wallHeight, dummy]);

  useEffect(() => {
    const lintelHeight = wallHeight - GATE_OPENING_HEIGHT;
    const verticalRepeat = lintelHeight / wallHeight;

    if (gateTopWallMaterial.map) {
      gateTopWallMaterial.map.repeat.set(1, verticalRepeat);
      gateTopWallMaterial.map.offset.set(0, 1 - verticalRepeat);
      gateTopWallMaterial.map.needsUpdate = true;
    }

    if (gateTopWallMaterial.normalMap) {
      gateTopWallMaterial.normalMap.repeat.set(1, verticalRepeat);
      gateTopWallMaterial.normalMap.offset.set(0, 1 - verticalRepeat);
      gateTopWallMaterial.normalMap.needsUpdate = true;
    }

    if (gateTopWallMaterial.aoMap) {
      gateTopWallMaterial.aoMap.repeat.set(1, verticalRepeat);
      gateTopWallMaterial.aoMap.offset.set(0, 1 - verticalRepeat);
      gateTopWallMaterial.aoMap.needsUpdate = true;
    }
  }, [wallHeight]);

  useEffect(() => {
    const sidePartDepth = (cellSize - GATE_WIDTH) / 2;
    const horizontalRepeat = sidePartDepth / cellSize;

    if (gateMaterial.map) {
      gateMaterial.map.repeat.set(horizontalRepeat, 1);
      gateMaterial.map.offset.set(1 - horizontalRepeat, 0);
      gateMaterial.map.needsUpdate = true;
    }

    if (gateMaterial.normalMap) {
      gateMaterial.normalMap.repeat.set(horizontalRepeat, 1);
      gateMaterial.normalMap.offset.set(1 - horizontalRepeat, 0);
      gateMaterial.normalMap.needsUpdate = true;
    }

    if (gateMaterial.aoMap) {
      gateMaterial.aoMap.repeat.set(horizontalRepeat, 1);
      gateMaterial.aoMap.offset.set(1 - horizontalRepeat, 0);
      gateMaterial.aoMap.needsUpdate = true;
    }
  }, [cellSize]);

  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        {visibleWallsData.map((wall) => (
          <CuboidCollider
            key={`coll-${wall.key}`}
            args={[cellSize / 2, wallHeight / 2, cellSize / 2]}
            position={[wall.x, wallHeight / 2, wall.z]}
          />
        ))}
      </RigidBody>

      {wallMaterialsGroups.map((materials, index) => (
        <instancedMesh
          key={index}
          ref={(el) => {
            wallRefs.current[index] = el;
          }}
          args={[boxGeom, materials, walls.length]}
          castShadow
          receiveShadow
        />
      ))}

      <group>
        {visibleGateWalls.map((wall) => {
          const sidePartDepth = (cellSize - GATE_WIDTH) / 2;
          const { side, top } = gatePartGeometries;

          return (
            <group key={wall.key}>
              <mesh
                geometry={side}
                material={gateSideMaterials}
                position={[
                  wall.x,
                  wallHeight / 2,
                  wall.z - GATE_WIDTH / 2 - sidePartDepth / 2,
                ]}
                castShadow
                receiveShadow
              />
              <mesh
                geometry={side}
                material={gateSideMaterials}
                position={[
                  wall.x,
                  wallHeight / 2,
                  wall.z + GATE_WIDTH / 2 + sidePartDepth / 2,
                ]}
                castShadow
                receiveShadow
              />
              <mesh
                geometry={top}
                material={lintelMaterials}
                position={[
                  wall.x,
                  GATE_OPENING_HEIGHT + (wallHeight - GATE_OPENING_HEIGHT) / 2,
                  wall.z,
                ]}
                castShadow
                receiveShadow
              />
            </group>
          );
        })}
      </group>

      {entrancePos && (
        <Gates
          position={entrancePos}
          rotation={[0, Math.PI / 2, 0]}
          scale={1}
        />
      )}
      {exitPos && (
        <Gates position={exitPos} rotation={[0, -Math.PI / 2, 0]} scale={1} />
      )}
    </group>
  );
}

export default memo(Walls);
