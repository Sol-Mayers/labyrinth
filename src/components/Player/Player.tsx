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
  movementLocked?: boolean;
  onRoofMoveRequest?: (action: "up" | "down") => void;
  roofAction?: "up" | "down" | null;
}

export default function FPSController({
  labyrinth,
  cellSize,
  originX,
  originZ,
  onSprintEnergyChange,
  onPositionChange,
  isInsideHouse = false,
  movementLocked = false,
  onRoofMoveRequest,
  roofAction,
  position
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

  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioRefs = useRef<(THREE.Audio | null)[]>([]);
  const audioRefsInHouse = useRef<(THREE.Audio | null)[]>([]);
  const audioListenerRef = useRef<THREE.AudioListener | null>(null);
  const audioLoaderRef = useRef(new THREE.AudioLoader());

  const lastFootstepPhaseRef = useRef<"none" | "left" | "right">("none");

  useEffect(() => {
    const enable = () => setSoundEnabled(true);
    window.addEventListener("click", enable, { once: true });
    return () => window.removeEventListener("click", enable);
  }, []);

  useEffect(() => {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    audioListenerRef.current = listener;
    const loader = audioLoaderRef.current;

    Array.from({ length: 8 }).forEach((_, i) => {
      const sound = new THREE.Audio(listener);
      loader.load(`/sound/player/shag-${i + 1}.wav`, (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.4);
      });
      audioRefs.current[i] = sound;
    });

    Array.from({ length: 8 }).forEach((_, i) => {
      const sound = new THREE.Audio(listener);
      loader.load(`/sound/player/shag-${i + 1}_inhouse.wav`, (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.4);
      });
      audioRefsInHouse.current[i] = sound;
    });

    return () => {
      camera.remove(listener);
      [...audioRefs.current, ...audioRefsInHouse.current].forEach((sound) => {
        if (sound?.isPlaying) sound.stop();
      });
      audioRefs.current = [];
      audioRefsInHouse.current = [];
      audioListenerRef.current = null;
    };
  }, [camera]);

  useEffect(() => {
    const body = rigidRef.current;
    if (!body || !position) return;

    body.setTranslation(
      { x: position[0], y: position[1], z: position[2] },
      true
    );
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);

    playerPosRef.current.set(position[0], position[1], position[2]);
    camera.position.set(
      position[0],
      position[1] + visualCameraY.current,
      position[2]
    );
  }, [position, camera]);

  const playStepSound = () => {
    const soundsPool = isInsideHouse ? audioRefsInHouse.current : audioRefs.current;
    const availableSounds = soundsPool.filter(
      (ref) => ref && ref.buffer && !ref.isPlaying
    );
    if (availableSounds.length === 0) return;

    const randomIdx = Math.floor(Math.random() * availableSounds.length);
    const sound = availableSounds[randomIdx];

    if (sound) {
      sound.setPlaybackRate(0.9 + Math.random() * 0.2);
      sound.play();
    }
  };

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
      groundSensorArgs: [0.22, 0.04, 0.22] as [number, number, number],
      groundSensorPosition: [0, -0.84, 0] as [number, number, number],
      bobFrequency: 5,
      bobAmountX: 0.03,
      bobAmountY: 0.02,
    }),
    []
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
      "KeyE",
    ]);

    const down = (e: KeyboardEvent) => {
      if (!shouldCaptureKeyboard()) return;
      if (blockedCodes.has(e.code)) e.preventDefault();
      if (movementLocked) return;

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
        case "KeyE":
          if (roofAction) onRoofMoveRequest?.(roofAction);
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
  }, [movementLocked, roofAction, onRoofMoveRequest]);

  useFrame((state, delta) => {
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

    moveDirection.set(0, 0, 0).addScaledVector(cameraForward, zInput).addScaledVector(cameraRight, xInput);

    const isMoving = moveDirection.lengthSq() > 0.01;
    if (moveDirection.lengthSq() > 1) moveDirection.normalize();

    if (movementLocked) {
      body.setGravityScale(0, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      camera.position.set(pos.x, pos.y + visualCameraY.current, pos.z);
      return;
    }

    if (grounded && isMoving) {
      const currentSpeed = new THREE.Vector3(currentVel.x, 0, currentVel.z).length();
      const speedMultiplier = isInsideHouse ? 1.7 : 1.0;
      const bobSpeed = THREE.MathUtils.clamp(currentSpeed * settings.bobFrequency * speedMultiplier, 10.0, 30.0);
      bobTimeRef.current += delta * bobSpeed;
      const bobX = Math.sin(bobTimeRef.current * 0.5) * settings.bobAmountX;
      const bobY = Math.sin(bobTimeRef.current) * settings.bobAmountY;
      bobOffsetRef.current.x = bobX;
      bobOffsetRef.current.y = bobY;

      const isBottom = bobY < -settings.bobAmountY * 0.75;
      const isLeft = bobX < 0;
      const isRight = bobX > 0;
      let currentPhase: "none" | "left" | "right" = "none";

      if (isBottom && isLeft) currentPhase = "left";
      if (isBottom && isRight) currentPhase = "right";

      if (currentPhase !== "none" && currentPhase !== lastFootstepPhaseRef.current) {
        if (soundEnabled) playStepSound();
        lastFootstepPhaseRef.current = currentPhase;
      }

      if (!isBottom) {
        lastFootstepPhaseRef.current = "none";
      }
    } else {
      bobOffsetRef.current.x = THREE.MathUtils.lerp(bobOffsetRef.current.x, 0, delta * 5);
      bobOffsetRef.current.y = THREE.MathUtils.lerp(bobOffsetRef.current.y, 0, delta * 5);
      lastFootstepPhaseRef.current = "none";
    }

    if (grounded && isCrouchingRef.current !== keys.current.crouchPressed) {
      isCrouchingRef.current = keys.current.crouchPressed;
      setIsCrouched(keys.current.crouchPressed);
    }

    if (grounded && !isMoving) {
      body.setGravityScale(0, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      body.setGravityScale(1, true);
    }

    const canSprint =
      grounded &&
      !isCrouchingRef.current &&
      keys.current.shiftPressed &&
      sprintEnergyRef.current > 0 &&
      isMoving;

    let baseSpeed = isCrouchingRef.current ? settings.crouchSpeed : settings.moveSpeed;
    if (isInsideHouse) baseSpeed *= 0.4;
    const speed = canSprint ? baseSpeed * settings.sprintMultiplier : baseSpeed;
    const control = grounded ? 1 : settings.airControlMultiplier;

    const nextX = THREE.MathUtils.lerp(
      currentVel.x,
      moveDirection.x * speed * control,
      grounded ? 1 : delta * 4
    );
    const nextZ = THREE.MathUtils.lerp(
      currentVel.z,
      moveDirection.z * speed * control,
      grounded ? 1 : delta * 4
    );

    let nextY = currentVel.y;
    if (grounded && !isMoving) nextY = 0;

    if (grounded) {
      if (canSprint) {
        sprintEnergyRef.current = Math.max(0, sprintEnergyRef.current - delta);
      } else {
        sprintEnergyRef.current = Math.min(
          settings.maxSprintEnergy,
          sprintEnergyRef.current + delta * 0.5
        );
      }
      onSprintEnergyChange?.(sprintEnergyRef.current);
    }

    const targetH = isCrouched ? settings.crouchCameraHeight : settings.standCameraHeight;
    visualCameraY.current = THREE.MathUtils.lerp(
      visualCameraY.current,
      targetH,
      delta * settings.crouchTransitionSpeed
    );

    camera.position.set(
      pos.x + cameraRight.x * bobOffsetRef.current.x,
      pos.y + visualCameraY.current + bobOffsetRef.current.y,
      pos.z + cameraRight.z * bobOffsetRef.current.x
    );

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
        linearDamping={0.5}
      >
        <CapsuleCollider
          args={isCrouched ? settings.crouchCapsule : settings.standCapsule}
          position={isCrouched ? settings.crouchColliderPosition : settings.standColliderPosition}
          friction={0}
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