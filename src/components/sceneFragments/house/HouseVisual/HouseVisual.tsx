import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import Door from "../Doors/Entrance";

export default function HouseVisual() {
  const { scene } = useGLTF("/models/houseFinal12-compressed-2.glb");
  const { scene: humanScene } = useGLTF("/models/human.glb");

  const textures = useTexture({
    wall: "/models/textures/concreteYellow2.png",
    brick: "/models/textures/brickYellow.png",
  });

  textures.brick.wrapS = textures.brick.wrapT = THREE.RepeatWrapping;

  const { optimizedHouse, doorData, yOffset } = useMemo(() => {
    const root = scene.clone();

    const sharedBrickMat = new THREE.MeshStandardMaterial({
      map: textures.brick,
      color: "#bebe97",
      side: THREE.BackSide,
    });

    let geo: THREE.BufferGeometry | null = null;
    let mat: THREE.Material | THREE.Material[] | null = null;

    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const mesh = child;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (mesh.name === "Base_01_0002") {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => (m.side = THREE.FrontSide));
        } else {
          mesh.material.side = THREE.FrontSide;
        }
      }

      if (mesh.name.includes("Cupboard_Upper")) {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        if (mesh.name === "Cupboard_Upper_01_Door_R_Cupboard_Upper_01_mat_0005_1") {
          mesh.position.y = 2.26;
        }
      }

      if (mesh.name === "Staircase_(lestniza)") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name === "Plane007_5") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name.includes("defaultMaterial")) {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.position.y = 0.25;
      }

      if (mesh.name === "mirror") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.position.y = 3.9;
      }

      if (mesh.name === "Toilet") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.scale.y = 0.34;
        mesh.position.y = 2.9;
        mesh.position.x = -0.84;
      }

      if (mesh.name === "Bath") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.scale.y = 0.835;
      }

      if (mesh.name.includes("Cube0")) {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name.includes("Legs_Backside_Chair_and_Rack_")) {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name === "Table") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name.includes("Lamp_Button")) {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name === "lamp2006") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.DoubleSide;
      }

      if (mesh.name === "lamp1002" || mesh.name === "lamp1003" || mesh.name === "lamp1001") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name === "Sofa") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.position.z = 0.1;
        mesh.position.x = -1.89;
        mesh.position.y = 0.564;
      }

      if (mesh.name === "TV_49Zoll_Black_0") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.position.y = 1.6;
      }

      if (mesh.name === "TV_49Zoll_Black_0_2") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.position.y = 1.60525;
      }

      if (mesh.name === "TV_49Zoll_Black_0_1") {
        if (!Array.isArray(mesh.material)) {
          mesh.position.y = 1.291;
          mesh.material.side = THREE.BackSide;
        }
      }

      if (mesh.name === "Bed") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.scale.set(0.87, 1, 1.1);
        mesh.position.set(2.54, 2.9, -0.75);
      }

      if (mesh.name === "Armchair") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
        mesh.scale.y = 0.6;
        mesh.position.y = 3.165;
      }

      if (mesh.name.includes("Box_Wood_")) {
        if (!Array.isArray(mesh.material)) {
          mesh.material.side = THREE.FrontSide;
          mesh.material.color.set("#a8a886");
        }
      }

      if (mesh.name === "Plane007_8") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.BackSide;
      }

      if (
        mesh.name === "Door_1" ||
        mesh.name === "Door_2" ||
        mesh.name === "Door_3" ||
        mesh.name === "Door_4" ||
        mesh.name === "Door_5"
      ) {
        mesh.visible = false;
      }

      if (mesh.name === "Plane007_1") {
        mesh.material = sharedBrickMat;
      }

      if (mesh.name === "Plane007_2") {
        if (!Array.isArray(mesh.material)) {
          mesh.material.map = textures.wall;
          mesh.material.color.set("#c6cdad");
        }
      }

      if (mesh.name === "Plane007_3") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name === "stairToSecondFloor") {
        if (!Array.isArray(mesh.material)) mesh.material.side = THREE.FrontSide;
      }

      if (mesh.name === "Cupboard_Upper_01_Door_R_Cupboard_Upper_01_mat_0005_13") {
        if (!Array.isArray(mesh.material)) {
          mesh.material.side = THREE.FrontSide;
        }
        mesh.scale.y = 0.8;
        mesh.position.y = 0.955;
      }

      if (mesh.name === "Door_1") {
        geo = mesh.geometry.clone();
        mat = Array.isArray(mesh.material)
          ? mesh.material.map((m) => m.clone())
          : mesh.material.clone();

        mesh.visible = false;
      }
    });

    const box = new THREE.Box3().setFromObject(root);
    const yOffset = -box.min.y;

    return {
      optimizedHouse: root,
      doorData: { geo, mat },
      yOffset,
    };
  }, [scene, textures]);

  const human = useMemo(() => {
    const root = humanScene.clone();
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return root;
  }, [humanScene]);

  return (
    <>
      <Door
        geometry={doorData.geo}
        material={doorData.mat}
        position={[-0.352, 1.216, -2.998]}
        doorScale={[0.941, 1.035, 1.4]}
        rotation={[0, 0, 0]}
        manual
      />

      <Door
        geometry={doorData.geo}
        material={doorData.mat}
        position={[-0.313, 3.862, -3.868]}
        rotation={[0, 0, 0]}
        doorScale={[0.941, 1.035, 1.4]}
        colliderArgs={[0.377, 1.035, 0.03]}
      />

      <Door
        geometry={doorData.geo}
        material={doorData.mat}
        position={[-0.965, 3.862, -5.16]}
        rotation={[0, 0, 0]}
        doorScale={[0.94, 1.035, 1.4]}
        colliderArgs={[0.377, 1.035, 0.03]}
      />

      <Door
        geometry={doorData.geo}
        material={doorData.mat}
        position={[0.72, 1.215, -6.675]}
        rotation={[0, Math.PI * 1.5, 0]}
        doorScale={[0.938, 1.035, 1.4]}
      />

      <Door
        geometry={doorData.geo}
        material={doorData.mat}
        position={[0.72, 3.86, -4.124]}
        rotation={[0, Math.PI * 0.5, 0]}
        doorScale={[0.938, 1.035, 1.4]}
      />

      <primitive
        object={optimizedHouse}
        position={[0, yOffset * 0.07, -5]}
        scale={[1, 1.1, 1]}
      />

      <primitive
        object={human}
        position={[-10.2, 0.81, 0]}
        rotation={[0, Math.PI * 0.5, 0]}
        scale={0.65}
      />
    </>
  );
}