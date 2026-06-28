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
  isEntrance?: boolean;
}

export default function Door({
  geometry,
  material,
  position,
  rotation = [0, 0, 0],
  doorScale = [1, 1.03, 1.4],
  colliderArgs = [0.38, 1.03, 0.03],
  triggerArgs = [0.4, 1.1, 0.1],
  safetyArgs = [0.4, 1.1, 0.8],
  hingeOffset = [0.375, 0, 0],
  manual = false,
  isEntrance = false,
}: DoorProps) {
  const doorRef = useRef<RapierRigidBody>(null);
  const [isOpeningTriggered, setIsOpeningTriggered] = useState(false);
  const [isInSafetyZone, setIsInSafetyZone] = useState(false);
  const [isPlayerNearManualDoor, setIsPlayerNearManualDoor] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentAngle = useRef(0);
  const openDirection = useRef(1);
  const directionLocked = useRef(false);
  const openAngle = Math.PI * 0.5;
  const closedAngle = 0;

  const openSound = useMemo(() => new Audio("/sound/house/open-door.wav"), []);
  const closeSound = useMemo(() => new Audio("/sound/house/close-door.wav"), []);
  const lockSound = useMemo(() => new Audio("/sound/house/lock.wav"), []); // Новый звук

  const baseQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
    [rotation]
  );
  const labelPosition = useMemo(() => [0.37, 0.3, 0.02] as Vec3, []);
  const shouldBeOpen = manual ? isManualOpen : isInSafetyZone && isOpeningTriggered;
  const isFirstMount = useRef(true);
  const closeTimerRef = useRef<number | null>(null);

  const updateOpenDirectionFromBody = (body: RapierRigidBody | null | undefined) => {
    if (directionLocked.current) return;
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
      directionLocked.current = true;
      setIsAnimating(true);
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeSound.currentTime = 0;
      closeSound.play().catch(() => {});
      setIsAnimating(true);
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

      if (!isManualOpen) {
        // Если дверь закрыта: сначала засов, потом логика открытия
        lockSound.currentTime = 0;
        lockSound.play().catch(() => {});
        setTimeout(() => {
          setIsManualOpen(true);
        }, 400); // Небольшая задержка, пока звучит засов
      } else {
        // Если дверь открыта: просто меняем состояние (закрытие начнется через useEffect)
        setIsManualOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [manual, isPlayerNearManualDoor, isManualOpen, lockSound]);

  useFrame((_, delta) => {
    if (!doorRef.current) return;
    const targetAngle = shouldBeOpen ? openAngle * openDirection.current : closedAngle;
    const diff = Math.abs(currentAngle.current - targetAngle);

    if (diff < 0.001) {
      if (isAnimating) {
        currentAngle.current = targetAngle;
        if (targetAngle === 0) {
          directionLocked.current = false;
          // Если дверь только что полностью закрылась вручную, играем засов
          if (manual && !isManualOpen) {
            lockSound.currentTime = 0;
            lockSound.play().catch(() => {});
          }
        }
        setIsAnimating(false);
      }
      return;
    }

    if (!isAnimating) {
      setIsAnimating(true);
    }

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

    if (doorRef.current.bodyType() === 2) {
      doorRef.current.setNextKinematicRotation(finalQuat);
      doorRef.current.setNextKinematicTranslation({
        x: position[0],
        y: position[1],
        z: position[2],
      });
    }
  });

  return (
    <>
      <RigidBody
        ref={doorRef}
        type={isAnimating ? "kinematicPosition" : "fixed"}
        colliders={false}
        position={position}
        rotation={rotation}
        canSleep={false}
      >
        <group scale={doorScale}>
          <mesh geometry={geometry!} material={material!} position={hingeOffset!} />
          <CuboidCollider
            args={colliderArgs}
            position={[Math.PI * 0.133, 0, 0]}
            friction={1}
            restitution={0}
          />
          {manual && (
            <CuboidCollider
              sensor
              args={triggerArgs}
              position={[Math.PI * 0.125, 0.1, 0]}
              onIntersectionEnter={(e) => {
                if (currentAngle.current === 0) updateOpenDirectionFromBody(e.other.rigidBody);
                setIsPlayerNearManualDoor(true);
              }}
              onIntersectionExit={() => {
                setIsPlayerNearManualDoor(false);
              }}
            />
          )}
          {manual && isPlayerNearManualDoor && (
            <Html position={labelPosition} center distanceFactor={1.2}>
              <div style={{
                color: "white",
                fontSize: "20px",
                fontWeight: 700,
                fontFamily: "'Exo 2', 'Rajdhani', sans-serif",
                textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                whiteSpace: "nowrap",
                transition: "opacity 0.3s ease",
              }}>
                {isManualOpen ? "Закрыть (E)" : "Открыть (E)"}
              </div>
            </Html>
          )}
        </group>
      </RigidBody>

      <RigidBody type="fixed" colliders={false} position={position} rotation={rotation}>
        <CuboidCollider
          sensor
          args={safetyArgs}
          position={[Math.PI * 0.12, 0.1, 0]}
          onIntersectionEnter={(e) => {
            if (!manual) {
              updateOpenDirectionFromBody(e.other.rigidBody);
              setIsInSafetyZone(true);
            }
          }}
          onIntersectionExit={() => {
            if (!manual) {
              setIsInSafetyZone(false);
              setIsOpeningTriggered(false);
            }
          }}
        />
        {!manual && (
          <CuboidCollider
            sensor
            args={triggerArgs}
            position={[Math.PI * 0.12, 0.1, 0]}
            onIntersectionEnter={(e) => {
              updateOpenDirectionFromBody(e.other.rigidBody);
              setIsOpeningTriggered(true);
            }}
          />
        )}
      </RigidBody>
    </>
  );
}