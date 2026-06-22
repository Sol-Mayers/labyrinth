import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Box3, Vector3 } from "three";

interface GatesProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

const Gates = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: GatesProps) => {
  const { scene } = useGLTF("/models/gates.glb");

  const { clonedScene, size } = useMemo(() => {
    const cloned = scene.clone();
    // Вычисляем реальные размеры модели с учетом масштаба
    const box = new Box3().setFromObject(cloned);
    const modelSize = new Vector3();
    box.getSize(modelSize);

    return {
      clonedScene: cloned,
      size: modelSize.multiplyScalar(scale),
    };
  }, [scene, scale]);

  // Смещение по Y, чтобы модель стояла на земле (если pivot в центре)
  const adjustedPosition: [number, number, number] = [
    position[0],
    position[1] + size.y / 2,
    position[2],
  ];

  return (
    <RigidBody
      type="fixed"
      colliders={false} // Отключаем trimesh
      position={adjustedPosition}
      rotation={rotation}
    >
      {/* Отключаем тени для теста FPS, если модель тяжелая */}
      <primitive object={clonedScene} scale={scale} castShadow receiveShadow />

      {/* 
        args в CuboidCollider — это ПОЛОВИНЫ размеров (half-extents).
        Если ваша модель ворот имеет ширину 2.4м, высоту 3м и толщину 0.5м, 
        аргументы должны быть [1.2, 1.5, 0.25]
      */}
      <CuboidCollider args={[size.x / 2, size.y / 2, size.z / 2]} />
    </RigidBody>
  );
};

export default Gates;
