import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { InstancedMesh, Object3D } from "three";
import { useGLTF } from "@react-three/drei";

interface FloorProps {
  labyrinth: number[][];
  cellSize: number;
  playerPos: THREE.Vector3;
  viewRadius: number;
  mode: "orbit" | "fps";
  grassDensity?: number;
}

const textureLoader = new THREE.TextureLoader();

const floorMat = new THREE.MeshStandardMaterial({
  color: "#bcbc8f",
  roughness: 0.8,
  map: textureLoader.load("/textures/floor/floor17.jpg"),
  normalMap: textureLoader.load("/textures/floor/floor17_normal.jpg"),
  aoMap: textureLoader.load("/textures/floor/floor17_ambient.jpg"),
});

const floorGeom = new THREE.PlaneGeometry(1, 1);

const dummy = new Object3D();
const grassDummy = new Object3D();

type CellData = {
  x: number;
  z: number;
  rotZ: number;
  grassBushes: Array<{
    offsetX: number;
    offsetZ: number;
    scale: number;
    rotation: number;
    bushIndex: number;
  }>;
};

type GrassPart = {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
};

type GrassBush = {
  points: Array<{
    offsetX: number;
    offsetZ: number;
    scale: number;
    rotation: number;
    partIndex: number;
  }>;
};

function rotationForCell(index: number) {
  const rotations = [Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
  return rotations[index % rotations.length];
}

function Floor({
  labyrinth,
  cellSize,
  playerPos,
  viewRadius,
  mode,
  grassDensity = 0.2,
}: FloorProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const grassRefs = useRef<Array<InstancedMesh | null>>([]);

  const { scene } = useGLTF("/models/grass5.glb");

  const grassParts = useMemo(() => {
    const parts: GrassPart[] = [];

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;

      const mesh = child as THREE.Mesh;
      const geometry = mesh.geometry.clone();
      mesh.updateMatrixWorld(true);
      geometry.applyMatrix4(mesh.matrixWorld);
      geometry.center();

      const positionAttr = geometry.attributes.position;

      if (positionAttr instanceof THREE.BufferAttribute) {
        const box = new THREE.Box3().setFromBufferAttribute(positionAttr);
        geometry.translate(0, -box.min.y, 0);
      } else if (positionAttr instanceof THREE.InterleavedBufferAttribute) {
        geometry.computeBoundingBox();
        if (geometry.boundingBox) {
          geometry.translate(0, -geometry.boundingBox.min.y, 0);
        }
      }

      const material = Array.isArray(mesh.material)
        ? mesh.material[0]
        : mesh.material;

      parts.push({
        geometry,
        material: material.clone(),
      });
    });

    return parts;
  }, [scene]);

  const grassBushes = useMemo(() => {
    if (grassParts.length === 0) return [];

    const bushes: GrassBush[] = [];

    for (let b = 0; b < 5; b++) {
      const count = 8 + Math.floor(Math.random() * 13);
      const points: GrassBush["points"] = [];

      for (let i = 0; i < count; i++) {
        points.push({
          offsetX: (Math.random() - 0.2) * 0.2,
          offsetZ: (Math.random() - 0.2) * 0.2,
          scale: 0.12 + Math.random() * 0.08,
          rotation: Math.random() * Math.PI * 2,
          partIndex: Math.floor(Math.random() * grassParts.length),
        });
      }

      bushes.push({ points });
    }

    return bushes;
  }, [grassParts.length]);

  const mapData = useMemo(() => {
    const rows = labyrinth.length;
    const cols = labyrinth[0]?.length ?? 0;
    const originX = -((cols * cellSize) / 2) + cellSize / 2;
    const originZ = -((rows * cellSize) / 2) + cellSize / 2;

    const walkableCells: CellData[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (labyrinth[r][c] !== 0) continue;

        const cellX = originX + c * cellSize;
        const cellZ = originZ + r * cellSize;

        const grassBushesInCell: CellData["grassBushes"] = [];

        if (grassBushes.length > 0 && Math.random() < grassDensity) {
          const bushIndex = Math.floor(Math.random() * grassBushes.length);

          const offsets = [
            { x: 0, z: 0 },
            { x: -0.5, z: -0.5 },
            { x: 0.5, z: -0.5 },
            { x: -0.5, z: 0.5 },
            { x: 0.5, z: 0.5 },
          ];

          const chosenOffset =
            offsets[Math.floor(Math.random() * offsets.length)];

          grassBushesInCell.push({
            offsetX: chosenOffset.x * cellSize,
            offsetZ: chosenOffset.z * cellSize,
            scale: 1,
            rotation: Math.random() * Math.PI * 2,
            bushIndex,
          });
        }

        walkableCells.push({
          x: cellX,
          z: cellZ,
          rotZ: rotationForCell(r * cols + c),
          grassBushes: grassBushesInCell,
        });
      }
    }

    return { rows, cols, walkableCells };
  }, [labyrinth, cellSize, grassDensity, grassBushes.length]);

  const visibleCells = useMemo(() => {
    if (mode !== "fps") return mapData.walkableCells;
    const rSq = viewRadius * viewRadius;
    return mapData.walkableCells.filter((cell) => {
      const dx = cell.x - playerPos.x;
      const dz = cell.z - playerPos.z;
      return dx * dx + dz * dz <= rSq;
    });
  }, [mapData.walkableCells, mode, playerPos.x, playerPos.z, viewRadius]);

  useEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.count = visibleCells.length;

    const grassCounts = grassParts.map(() => 0);

    visibleCells.forEach((cell, i) => {
      dummy.position.set(cell.x, 0, cell.z);
      dummy.rotation.set(-Math.PI / 2, 0, cell.rotZ);
      dummy.scale.set(cellSize, cellSize, 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      cell.grassBushes.forEach((bush) => {
        const bushData = grassBushes[bush.bushIndex];
        if (!bushData) return;

        bushData.points.forEach((point) => {
          const grassMesh = grassRefs.current[point.partIndex];
          if (!grassMesh) return;

          grassDummy.position.set(
            cell.x + bush.offsetX + point.offsetX,
            -0.03,
            cell.z + bush.offsetZ + point.offsetZ,
          );
          grassDummy.rotation.set(0, bush.rotation + point.rotation, 0);
          grassDummy.scale.set(point.scale, point.scale, point.scale);
          grassDummy.updateMatrix();

          const idx = grassCounts[point.partIndex];
          grassMesh.setMatrixAt(idx, grassDummy.matrix);
          grassCounts[point.partIndex]++;
        });
      });
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingBox();
    meshRef.current.computeBoundingSphere();

    grassRefs.current.forEach((mesh, partIndex) => {
      if (!mesh) return;
      mesh.count = grassCounts[partIndex];
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    });
  }, [visibleCells, cellSize, grassParts, grassBushes]);

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[floorGeom, floorMat, mapData.walkableCells.length]}
        receiveShadow
      />

      {grassParts.map((part, index) => (
        <instancedMesh
          key={index}
          ref={(el) => {
            grassRefs.current[index] = el;
          }}
          args={[
            part.geometry,
            part.material,
            mapData.walkableCells.length * 20,
          ]}
          castShadow
        />
      ))}

      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[
            (mapData.cols * cellSize) / 2,
            0.1,
            (mapData.rows * cellSize) / 2,
          ]}
          position={[0, -0.1, 0]}
        />
      </RigidBody>
    </>
  );
}

useGLTF.preload("/models/grass5.glb");

export default memo(Floor);
