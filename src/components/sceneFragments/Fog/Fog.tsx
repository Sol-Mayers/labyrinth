import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

interface FogProps {
  color?: string | number;
  density?: number;
}

export default function Fog({ color = "#050505", density = 0.15 }: FogProps) {
  const { scene } = useThree();

  // Создаем объект тумана один раз
  const fog = useMemo(
    () => new THREE.FogExp2(color, density),
    [color, density],
  );

  useEffect(() => {
    // Применяем туман к сцене при монтировании
    scene.fog = fog;
    // Очищаем при размонтировании
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  return null; // Компонент ничего не рендерит сам по себе
}
