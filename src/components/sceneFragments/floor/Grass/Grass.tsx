import { memo, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CuboidCollider } from "@react-three/rapier";

type GrassAlongWallsProps = {
  labyrinth: number[][];
  cellSize: number;
  patchDensity?: number;
  patchRadius?: number;
  patchDisplacementScale?: number;
  grassPerPatchMin?: number;
  grassPerPatchMax?: number;
  yOffset?: number;
  playerPos: THREE.Vector3;
  viewRadius: number;
  mode: "orbit" | "fps";
};

// Константы вынесены за пределы компонента
const HILL_HEIGHT = 0.2;
const SINK_DEPTH = 0.08;
const MESH_Y_OFFSET = -0.05;

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();

const textureLoader = new THREE.TextureLoader();

const groundDiffuse = textureLoader.load("/textures/floor5.png");
groundDiffuse.wrapS = groundDiffuse.wrapT = THREE.RepeatWrapping;
groundDiffuse.repeat.set(1, 1);

const groundDisplacement = textureLoader.load(
  "/textures/floor5_displacement.png",
);
groundDisplacement.wrapS = groundDisplacement.wrapT = THREE.RepeatWrapping;
groundDisplacement.repeat.set(1, 1);

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function GrassAlongWalls({
  labyrinth,
  cellSize,
  patchDensity = 0.3,
  patchRadius = 0.8,
  patchDisplacementScale = 0.12,
  grassPerPatchMin = 2,
  grassPerPatchMax = 5,
  yOffset = 0.02,
  playerPos,
  viewRadius,
  mode,
}: GrassAlongWallsProps) {
  const gltf = useGLTF("/models/grass10.glb") as any;
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // 1. Загрузка материалов травы
  const { mergedGrassGeometry, grassMaterial } = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) meshes.push(child);
    });
    const targetMesh = meshes[1] || meshes[0];
    if (targetMesh) {
      const geom = targetMesh.geometry.clone();
      const childMatrix = new THREE.Matrix4();
      childMatrix.compose(
        targetMesh.position,
        targetMesh.quaternion,
        targetMesh.scale,
      );
      geom.applyMatrix4(childMatrix);
      return {
        mergedGrassGeometry: geom,
        grassMaterial: new THREE.MeshStandardMaterial({
          color: "#5a833d",
          roughness: 0.8,
        }),
      };
    }
    return {
      mergedGrassGeometry: new THREE.PlaneGeometry(0.1, 0.3),
      grassMaterial: new THREE.MeshStandardMaterial({ color: "#5a833d" }),
    };
  }, [gltf]);

  // 2. ГЕНЕРАЦИЯ ВСЕХ ДАННЫХ (один раз для лабиринта)
  const allStaticData = useMemo(() => {
    const rows = labyrinth.length;
    const cols = labyrinth[0]?.length || 0;
    const originX = -((cols * cellSize) / 2) + cellSize / 2;
    const originZ = -((rows * cellSize) / 2) + cellSize / 2;
    const random = mulberry32(42);

    const patches: any[] = [];
    const colliders: any[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (labyrinth[r][c] !== 1) continue;
        const centerX = originX + c * cellSize;
        const centerZ = originZ + r * cellSize;

        [
          [0, -1],
          [0, 1],
          [-1, 0],
          [1, 0],
        ].forEach(([dr, dc]) => {
          const nr = r + dr,
            nc = c + dc;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            labyrinth[nr][nc] === 0
          ) {
            if (random() < patchDensity) {
              const edgeX = centerX + (dc * cellSize) / 2;
              const edgeZ = centerZ + (dr * cellSize) / 2;
              const off = patchRadius * 0.5 + random() * patchRadius * 0.3;
              const cx = edgeX + dc * off;
              const cz = edgeZ + dr * off;
              const rX = patchRadius * (0.7 + random() * 0.6);
              const rZ = patchRadius * (0.7 + random() * 0.6);

              // Геометрия холмика
              const segments = 18;
              const geom = new THREE.PlaneGeometry(
                rX * 2,
                rZ * 2,
                segments,
                segments,
              );
              geom.rotateX(-Math.PI / 2);

              const pos = geom.attributes.position;

              const noiseAt = (x: number, z: number) => {
                const n =
                  Math.sin(x * 2.7 + z * 1.9 + cx * 0.13 + cz * 0.17) * 0.5 +
                  Math.sin(x * 5.1 - z * 3.3 + cx * 0.07 - cz * 0.11) * 0.3 +
                  Math.sin((x + z) * 4.4 + cx * 0.05 + cz * 0.09) * 0.2;
                return n;
              };

              for (let i = 0; i < pos.count; i++) {
                const px = pos.getX(i);
                const pz = pos.getZ(i);

                const nx = px / rX;
                const nz = pz / rZ;
                const angle = Math.atan2(nz, nx);
                const baseRadius = Math.sqrt(nx * nx + nz * nz);

                const shapeNoise =
                  1 +
                  noiseAt(Math.cos(angle), Math.sin(angle)) * 0.18 +
                  Math.sin(angle * 3 + cx * 0.2 + cz * 0.15) * 0.08;

                const irregularRadius = Math.max(0.72, shapeNoise);
                const dist = baseRadius / irregularRadius;

                const t = Math.max(0, Math.min(1, 1 - dist));
                const smooth = t * t * (3 - 2 * t);

                pos.setY(
                  i,
                  (-SINK_DEPTH + (HILL_HEIGHT + SINK_DEPTH) * smooth) *
                    (0.7 + random() * 0.3),
                );
              }

              geom.translate(cx, 0, cz);
              geom.computeVertexNormals();

              // Трава для этого холмика
              const grassInPatch = [];
              const count =
                grassPerPatchMin +
                Math.floor(
                  random() * (grassPerPatchMax - grassPerPatchMin + 1),
                );
              for (let g = 0; g < count; g++) {
                const ang = random() * Math.PI * 2,
                  d = random() * 0.65;
                const gx = cx + Math.cos(ang) * d * rX,
                  gz = cz + Math.sin(ang) * d * rZ;
                const dC = Math.sqrt(
                  ((gx - cx) / rX) ** 2 + ((gz - cz) / rZ) ** 2,
                );
                const fall = Math.max(0, Math.min(1, 1 - dC));
                const sY =
                  -SINK_DEPTH +
                  (HILL_HEIGHT + SINK_DEPTH) * (fall * fall * (3 - 2 * fall));
                grassInPatch.push({
                  px: gx,
                  py: yOffset + sY,
                  pz: gz,
                  ry: random() * Math.PI * 2,
                  s: THREE.MathUtils.lerp(0.15, 0.28, random()),
                });
              }

              patches.push({ cx, cz, geometry: geom, grass: grassInPatch });
              colliders.push({
                cx,
                cz,
                halfX: rX * 0.55,
                halfY: HILL_HEIGHT * 0.2,
                halfZ: rZ * 0.55,
              });
            }
          }
        });
      }
    }
    return { patches, colliders };
  }, [
    labyrinth,
    cellSize,
    patchDensity,
    patchRadius,
    grassPerPatchMin,
    grassPerPatchMax,
    yOffset,
  ]);

  // 3. ФИЛЬТРАЦИЯ ПО ДИСТАНЦИИ (выполняется при движении игрока)
  const visibleData = useMemo(() => {
    const visiblePatches =
      mode === "orbit"
        ? allStaticData.patches
        : allStaticData.patches.filter(
            (p) =>
              Math.sqrt((p.cx - playerPos.x) ** 2 + (p.cz - playerPos.z) ** 2) <
              viewRadius,
          );

    let mergedGeom = null;
    if (visiblePatches.length > 0) {
      const geoms = visiblePatches.map((p) => p.geometry);
      mergedGeom = BufferGeometryUtils.mergeGeometries(geoms);
    }

    const grassInstances = visiblePatches.flatMap((p) => p.grass);

    const activeColliders =
      mode === "orbit"
        ? allStaticData.colliders
        : allStaticData.colliders.filter(
            (c) =>
              Math.sqrt((c.cx - playerPos.x) ** 2 + (c.cz - playerPos.z) ** 2) <
              viewRadius,
          );

    return { mergedGeom, grassInstances, activeColliders };
  }, [allStaticData, playerPos.x, playerPos.z, viewRadius, mode]);

  // Обновление матриц травы
  useEffect(() => {
    if (!instancedMeshRef.current) return;
    const instances = visibleData.grassInstances;
    instances.forEach((t, i) => {
      _position.set(t.px, t.py, t.pz);
      _quaternion.setFromEuler(_euler.set(0, t.ry, 0));
      _scale.set(t.s, t.s, t.s);
      instancedMeshRef.current!.setMatrixAt(
        i,
        _matrix.compose(_position, _quaternion, _scale),
      );
    });
    instancedMeshRef.current.count = instances.length;
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [visibleData.grassInstances]);

  return (
    <group>
      {visibleData.mergedGeom && (
        <mesh
          geometry={visibleData.mergedGeom}
          position={[0, MESH_Y_OFFSET, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#7a9a4a"
            roughness={0.95}
            map={groundDiffuse}
            displacementMap={groundDisplacement}
            displacementScale={patchDisplacementScale}
          />
        </mesh>
      )}
      {visibleData.activeColliders.map((hc, i) => (
        <CuboidCollider
          key={`${hc.cx}-${hc.cz}`}
          args={[hc.halfX, hc.halfY, hc.halfZ]}
          position={[hc.cx, HILL_HEIGHT * 0.2, hc.cz]}
        />
      ))}
      <instancedMesh
        ref={instancedMeshRef}
        args={[mergedGrassGeometry, grassMaterial, 5000]}
        position={[0, -0.05, 0]}
        receiveShadow
      />
    </group>
  );
}

export default memo(GrassAlongWalls);
useGLTF.preload("/models/grass10.glb");
