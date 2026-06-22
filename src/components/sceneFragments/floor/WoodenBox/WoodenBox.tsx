import { RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export function WoodenBox() {
  // Загрузка текстуры
  const texture = useTexture("/textures/wood-box/wood-box.jpg");
  const textureNormal = useTexture("/textures/wood-box/wood-box_normal.jpg");
  const textureAmbient = useTexture("/textures/wood-box/wood-box_ambient.jpg");

  const size = 0.5;
  const position: [number, number, number] = [0, size / 2, 0];

  return (
    <RigidBody
      position={position}
      rotation={[0, 2, 0]}
      colliders="cuboid"
      type="fixed"
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          map={texture}
          aoMap={textureAmbient}
          normalMap={textureNormal}
          normalScale={0.1}
          roughness={0.8}
          metalness={0.3}
          color={"#e4e4e4"}
        />
      </mesh>
    </RigidBody>
  );
}

// Предзагрузка текстуры для оптимизации
useTexture.preload("/textures/wood-box/wood-box.jpg");
