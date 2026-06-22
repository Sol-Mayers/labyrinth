import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CapsuleCollider,
  CuboidCollider,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const moveDirection = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();

interface FPSControllerProps {
  position?: [number, number, number];
  labyrinth: number[][];
  cellSize: number;
  originX: number;
  originZ: number;
  onSprintEnergyChange?: (value: number) => void;
  onPositionChange?: (pos: THREE.Vector3) => void;
  isInsideHouse?: boolean;
}

export default function FPSController({
  labyrinth,
  cellSize,
  originX,
  originZ,
  onSprintEnergyChange,
  onPositionChange,
  isInsideHouse = false,
}: FPSControllerProps) {
  const { camera } = useThree();
  const rigidRef = useRef<RapierRigidBody | null>(null);

  const [isCrouched, setIsCrouched] = useState(false);
  const isCrouchingRef = useRef(false);

  const visualCameraY = useRef(0.4);
  const sprintEnergyRef = useRef(10);
  const playerPosRef = useRef(new THREE.Vector3());

  const bobTimeRef = useRef(0);
  const bobOffsetRef = useRef(new THREE.Vector2(0, 0));

  const groundContactsRef = useRef(0);
  const groundedRef = useRef(false);

  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    crouchPressed: false,
    shiftPressed: false,
  });

  const settings = useMemo(
    () => ({
      moveSpeed: 3.5,
      crouchSpeed: 2,
      sprintMultiplier: 1.5,
      standCameraHeight: 0.7,
      crouchCameraHeight: 0.1,
      crouchTransitionSpeed: 10,
      standCapsule: [0.525, 0.3] as [number, number],
      crouchCapsule: [0.225, 0.3] as [number, number],
      standColliderPosition: [0, 0, 0] as [number, number, number],
      crouchColliderPosition: [0, -0.3, 0] as [number, number, number],
      maxSprintEnergy: 10,
      airControlMultiplier: 0.2,

      // тонкий сенсор под ногами
      groundSensorArgs: [0.22, 0.04, 0.22] as [number, number, number],
      groundSensorPosition: [0, -0.84, 0] as [number, number, number],

      // Настройки покачивания
      bobFrequency: 5,       // Частота шагов
      bobAmountX: 0.03,       // Амплитуда влево-вправо
      bobAmountY: 0.02,       // Амплитуда вверх-вниз
    }),
    [],
  );

  const spawnPosition = useMemo(() => {
    const rows = labyrinth.length;
    const cols = labyrinth[0]?.length ?? 0;
    return [
      originX + Math.floor(cols / 2) * cellSize,
      2,
      originZ + Math.floor(rows / 2) * cellSize,
    ] as [number, number, number];
  }, [labyrinth, cellSize, originX, originZ]);

  useEffect(() => {
    const shouldCaptureKeyboard = () => document.pointerLockElement !== null;
    const blockedCodes = new Set([
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ShiftLeft",
      "ControlLeft",
    ]);

    const down = (e: KeyboardEvent) => {
      if (!shouldCaptureKeyboard()) return;
      if (blockedCodes.has(e.code)) e.preventDefault();

      switch (e.code) {
        case "KeyW":
          keys.current.forward = true;
          break;
        case "KeyS":
          keys.current.backward = true;
          break;
        case "KeyA":
          keys.current.left = true;
          break;
        case "KeyD":
          keys.current.right = true;
          break;
        case "ShiftLeft":
          keys.current.shiftPressed = true;
          break;
        case "ControlLeft":
          keys.current.crouchPressed = true;
          break;
      }
    };

    const up = (e: KeyboardEvent) => {
      if (blockedCodes.has(e.code)) e.preventDefault();

      switch (e.code) {
        case "KeyW":
          keys.current.forward = false;
          break;
        case "KeyS":
          keys.current.backward = false;
          break;
        case "KeyA":
          keys.current.left = false;
          break;
        case "KeyD":
          keys.current.right = false;
          break;
        case "ShiftLeft":
          keys.current.shiftPressed = false;
          break;
        case "ControlLeft":
          keys.current.crouchPressed = false;
          break;
      }
    };

    const resetKeys = () => {
      Object.keys(keys.current).forEach((k) => {
        keys.current[k as keyof typeof keys.current] = false;
      });
    };

    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    window.addEventListener("blur", resetKeys);

    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
      window.removeEventListener("blur", resetKeys);
    };
  }, []);

  useFrame((_, delta) => {
    const body = rigidRef.current;
    if (!body) return;

    const currentVel = body.linvel();
    const pos = body.translation();
    const grounded = groundedRef.current;

    camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();
    cameraRight.crossVectors(cameraForward, camera.up).normalize();

    const xInput = Number(keys.current.right) - Number(keys.current.left);
    const zInput = Number(keys.current.forward) - Number(keys.current.backward);

    moveDirection
      .set(0, 0, 0)
      .addScaledVector(cameraForward, zInput)
      .addScaledVector(cameraRight, xInput);

    const isMoving = moveDirection.lengthSq() > 0;
    if (moveDirection.lengthSq() > 1) moveDirection.normalize();

    // --- ЛОГИКА КАЧАНИЯ ГОЛОВЫ ---
    if (grounded && isMoving) {
  const currentSpeed = new THREE.Vector3(currentVel.x, 0, currentVel.z).length();

  // 1) Чуть быстрее на обычной ходьбе
  // 2) Ограничиваем ускорение на быстром беге, чтобы не было "семенения"
  const bobSpeed = THREE.MathUtils.clamp(
    currentSpeed * settings.bobFrequency,
    10.0,
    22.0
  );

  bobTimeRef.current += delta * bobSpeed;

  bobOffsetRef.current.x = Math.sin(bobTimeRef.current * 0.5) * settings.bobAmountX;
  bobOffsetRef.current.y = Math.sin(bobTimeRef.current) * settings.bobAmountY;
} else {
  bobOffsetRef.current.x = THREE.MathUtils.lerp(bobOffsetRef.current.x, 0, delta * 5);
  bobOffsetRef.current.y = THREE.MathUtils.lerp(bobOffsetRef.current.y, 0, delta * 5);
}

    // Состояние приседания
    if (grounded && isCrouchingRef.current !== keys.current.crouchPressed) {
      isCrouchingRef.current = keys.current.crouchPressed;
      setIsCrouched(keys.current.crouchPressed);
    }

    // Гравитация и остановка (как в оригинале)
    if (grounded && !isMoving) {
      body.setGravityScale(0, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      body.setGravityScale(1, true);
    }

    const canSprint = grounded && !isCrouchingRef.current && keys.current.shiftPressed && sprintEnergyRef.current > 0 && isMoving;
    let baseSpeed = isCrouchingRef.current ? settings.crouchSpeed : settings.moveSpeed;
    if (isInsideHouse) baseSpeed *= 0.5;
    const speed = canSprint ? baseSpeed * settings.sprintMultiplier : baseSpeed;
    
    const control = grounded ? 1 : settings.airControlMultiplier;
    const nextX = THREE.MathUtils.lerp(currentVel.x, moveDirection.x * speed * control, grounded ? 1 : delta * 4);
    const nextZ = THREE.MathUtils.lerp(currentVel.z, moveDirection.z * speed * control, grounded ? 1 : delta * 4);
    let nextY = currentVel.y;
    if (grounded && !isMoving) nextY = 0;

    // Энергия
    if (grounded) {
      if (canSprint) {
        sprintEnergyRef.current = Math.max(0, sprintEnergyRef.current - delta);
      } else {
        sprintEnergyRef.current = Math.min(settings.maxSprintEnergy, sprintEnergyRef.current + delta * 0.5);
      }
      onSprintEnergyChange?.(sprintEnergyRef.current);
    }

    // Плавная высота камеры (приседание)
    const targetH = isCrouched ? settings.crouchCameraHeight : settings.standCameraHeight;
    visualCameraY.current = THREE.MathUtils.lerp(visualCameraY.current, targetH, delta * settings.crouchTransitionSpeed);

    // --- ПРИМЕНЕНИЕ ПОЗИЦИИ КАМЕРЫ С УЧЕТОМ КАЧАНИЯ ---
    // Добавляем bobOffset к базовой позиции
    camera.position.set(
        pos.x + cameraRight.x * bobOffsetRef.current.x, 
        pos.y + visualCameraY.current + bobOffsetRef.current.y, 
        pos.z + cameraRight.z * bobOffsetRef.current.x
    );
    
    // Физика
    if (!(grounded && !isMoving)) {
      body.setLinvel({ x: nextX, y: nextY, z: nextZ }, true);
    }

    if (onPositionChange) {
      const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      if (currentPos.distanceToSquared(playerPosRef.current) > 0.25) {
        playerPosRef.current.copy(currentPos);
        onPositionChange(currentPos);
      }
    }
  });

  return (
    <>
      <PointerLockControls />
      <RigidBody
        ref={rigidRef}
        type="dynamic"
        position={spawnPosition}
        enabledRotations={[false, false, false]}
        canSleep={false}
        colliders={false}
        linearDamping={0.5} // Немного уменьшил, так как мы сами управляем скоростью
      >
        <CapsuleCollider
          args={isCrouched ? settings.crouchCapsule : settings.standCapsule}
          position={isCrouched ? settings.crouchColliderPosition : settings.standColliderPosition}
          friction={0} // Оставляем 0 для легкого скольжения при ходьбе мимо стен
          restitution={0}
        />
        <CuboidCollider
          sensor
          args={settings.groundSensorArgs}
          position={settings.groundSensorPosition}
          onIntersectionEnter={() => {
            groundContactsRef.current += 1;
            groundedRef.current = true;
          }}
          onIntersectionExit={() => {
            groundContactsRef.current = Math.max(0, groundContactsRef.current - 1);
            groundedRef.current = groundContactsRef.current > 0;
          }}
        />
      </RigidBody>
    </>
  );
}