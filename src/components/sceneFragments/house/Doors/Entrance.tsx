import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
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
  manual?: boolean;
}

export default function Door({
  geometry,
  material,
  position,
  rotation = [0, 0, 0],
  doorScale = [1, 1.03, 1.4],
  colliderArgs = [0.375, 1.03, 0.03],
  triggerArgs = [0.4, 1.1, 0.1],
  safetyArgs = [0.4, 1.1, 0.8],
  hingeOffset = [0.375, 0, 0],
  manual = false,
}: DoorProps) {
  const doorRef = useRef<RapierRigidBody>(null);

  const [isOpeningTriggered, setIsOpeningTriggered] = useState(false);
  const [isInSafetyZone, setIsInSafetyZone] = useState(false);
  const [isPlayerNearManualDoor, setIsPlayerNearManualDoor] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const currentAngle = useRef(0);
  const openDirection = useRef(1);

  const openAngle = Math.PI * 0.5;
  const closedAngle = 0;

  const openSound = useMemo(() => new Audio("/sound/house/open-door.wav"), []);
  const closeSound = useMemo(() => new Audio("/sound/house/close-door.wav"), []);

  const baseQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    [rotation]
  );

  const labelPosition = useMemo(() => [0, 0.3, 0.02] as Vec3, []);

  const shouldBeOpen = manual ? isManualOpen : isInSafetyZone && isOpeningTriggered;

  const isFirstMount = useRef(true);
  const closeTimerRef = useRef<number | null>(null);

  const updateOpenDirectionFromBody = (body: RapierRigidBody | null | undefined) => {
    const playerPos = body?.translation();
    if (!playerPos) return;

    const doorPos = new THREE.Vector3(...position);
    const player = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);

    const localPlayerPos = player
      .sub(doorPos)
      .applyQuaternion(baseQuat.clone().invert());

    openDirection.current = localPlayerPos.z >= 0 ? 1 : -1;
  };

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (shouldBeOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      openSound.currentTime = 0;
      openSound.play().catch(() => {});
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeSound.currentTime = 0;
      closeSound.play().catch(() => {});
      closeTimerRef.current = null;
    }, 500);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [shouldBeOpen, openSound, closeSound]);

  useEffect(() => {
    if (!manual) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyE") return;
      if (!isPlayerNearManualDoor) return;
      setIsManualOpen((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [manual, isPlayerNearManualDoor]);

  useFrame((_, delta) => {
    if (!doorRef.current) return;

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
    doorRef.current.setNextKinematicTranslation({
      x: position[0],
      y: position[1],
      z: position[2],
    });
  });

  return (
    <>
      <RigidBody
        ref={doorRef}
        type="kinematicPosition"
        colliders={false}
        position={position}
        rotation={rotation}
        canSleep={false}
        enabledTranslations={[false, false, false]}
        enabledRotations={[false, true, false]}
      >
        <group position={hingeOffset}>
          <mesh
            geometry={geometry!}
            material={material!}
            castShadow
            receiveShadow
            scale={doorScale}
          />

          {/* Твёрдый коллайдер всегда едет вместе со створкой —
              и у обычных дверей, и у входной. При открытии он
              уходит из проёма, освобождая проход. */}
          <CuboidCollider
            args={colliderArgs}
            position={[0, 0, 0]}
            friction={1}
            restitution={0}
          />

          {manual && (
            <CuboidCollider
              sensor
              args={triggerArgs}
              position={[0, 0.1, 0]}
              onIntersectionEnter={(e) => {
                updateOpenDirectionFromBody(e.other.rigidBody);
                setIsPlayerNearManualDoor(true);
              }}
              onIntersectionExit={() => {
                setIsPlayerNearManualDoor(false);
              }}
            />
          )}

          {manual && isPlayerNearManualDoor ? (
            <Html
              position={labelPosition}
              center
              distanceFactor={1.2}
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 700,
                  fontFamily: "'Exo 2', 'Rajdhani', sans-serif",
                  textShadow: "2px 2px 10px rgba(0,0,0,1)",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  background: "rgba(0,0,0,0.3)",
                  padding: "4px 10px",
                  borderRadius: "4px",
                }}
              >
                {isManualOpen ? "Закрыть (E)" : "Открыть (E)"}
              </div>
            </Html>
          ) : null}
        </group>
      </RigidBody>

      {manual ? (
        <RigidBody type="fixed" colliders={false} position={position} rotation={rotation}>
          {/* Твёрдый коллайдер убран — он теперь на движущейся створке.
              Здесь остаётся только сенсор safety-зоны. */}
          <CuboidCollider
            sensor
            args={safetyArgs}
            position={[Math.PI * 0.12, 0.1, 0]}
            onIntersectionEnter={(e) => {
              if (!isManualOpen) {
                updateOpenDirectionFromBody(e.other.rigidBody);
              }
            }}
          />
        </RigidBody>
      ) : (
        <RigidBody type="fixed" colliders={false} position={position} rotation={rotation}>
          <CuboidCollider
            sensor
            args={safetyArgs}
            position={[Math.PI * 0.12, 0.1, 0]}
            onIntersectionEnter={(e) => {
              updateOpenDirectionFromBody(e.other.rigidBody);
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
            onIntersectionEnter={(e) => {
              updateOpenDirectionFromBody(e.other.rigidBody);
              setIsOpeningTriggered(true);
            }}
          />
        </RigidBody>
      )}
    </>
  );
}