import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CuboidCollider, RigidBody, RapierRigidBody } from "@react-three/rapier";

type Vec3 = [number, number, number];

interface DoorProps {
  geometry: THREE.BufferGeometry | null;
  material: THREE.Material | THREE.Material[] | null;
  position: Vec3;
  rotation?: Vec3;
  doorScale?: Vec3;
  colliderArgs?: Vec3;
  triggerArgs?: Vec3;
  safetyArgs?: Vec3;
  hingeOffset?: Vec3;
}

export default function Door({
  geometry,
  material,
  position,
  rotation = [0, 0, 0],
  doorScale = [1, 1.03, 1.4],
  colliderArgs = [0.375, 1.03, 0.03],
  triggerArgs = [0.4, 1.1, 0.2],
  safetyArgs = [0.8, 1.1, 0.8],
  hingeOffset = [0.375, 0, 0],
}: DoorProps) {
  const doorRef = useRef<RapierRigidBody>(null);
  const [isOpeningTriggered, setIsOpeningTriggered] = useState(false);
  const [isInSafetyZone, setIsInSafetyZone] = useState(false);

  const currentAngle = useRef(0);
  const openDirection = useRef(1);

  const openAngle = Math.PI * 0.6;
  const closedAngle = 0;

  const baseQuat = useMemo(() => {
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
  }, [rotation]);

  useFrame((_, delta) => {
    if (!doorRef.current) return;

    const shouldBeOpen = isInSafetyZone && isOpeningTriggered;
    const targetAngle = shouldBeOpen ? openAngle * openDirection.current : closedAngle;

    currentAngle.current = THREE.MathUtils.damp(
      currentAngle.current,
      targetAngle,
      7,
      delta
    );

    const localQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, currentAngle.current, 0)
    );

    const finalQuat = baseQuat.clone().multiply(localQuat);
    doorRef.current.setNextKinematicRotation(finalQuat);
  });

  return (
    <RigidBody
      ref={doorRef}
      type="kinematicPosition"
      colliders={false}
      position={position}
      rotation={rotation}
    >
      <group position={hingeOffset}>
        <mesh
          geometry={geometry!}
          material={material!}
          castShadow
          receiveShadow
          scale={doorScale}
        />
        <CuboidCollider args={colliderArgs} position={[0, 0, 0]} />
      </group>

      <CuboidCollider
        sensor
        args={safetyArgs}
        position={[Math.PI * 0.12, 0.1, 0]}
        onIntersectionEnter={(e) => {
          const playerPos = e.other.rigidBody?.translation();
          if (playerPos) {
            const doorPos = new THREE.Vector3(...position);
            const player = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);

            const localPlayerPos = player
              .sub(doorPos)
              .applyQuaternion(baseQuat.clone().invert());

            openDirection.current = localPlayerPos.z >= 0 ? 1 : -1;
          }

          setIsInSafetyZone(true);
        }}
        onIntersectionExit={() => {
          setIsInSafetyZone(false);
          setIsOpeningTriggered(false);
        }}
      />

      <CuboidCollider
        sensor
        args={triggerArgs}
        position={[Math.PI * 0.12, 0.1, 0]}
        onIntersectionEnter={() => setIsOpeningTriggered(true)}
      />
    </RigidBody>
  );
}