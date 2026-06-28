import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
} from "@react-three/rapier";
import { useRef } from "react";

export default function HouseColliders({
  onToggleSlowdown,
  onRoofActionChange,
  onRoofMoveRequest,
}: {
  onToggleSlowdown: (isInside: boolean) => void;
  onRoofActionChange?: (action: "up" | "down" | null) => void;
  onRoofMoveRequest?: (action: "up" | "down") => void;
}) {
  const insideCountRef = useRef(0);
  const nearRoofUpRef = useRef(0);
  const nearRoofDownRef = useRef(0);

  const enterInside = () => {
    insideCountRef.current += 1;
    onToggleSlowdown(true);
  };

  const exitInside = () => {
    insideCountRef.current = Math.max(0, insideCountRef.current - 1);
    if (insideCountRef.current === 0) {
      onToggleSlowdown(false);
    }
  };

  const enterRoofUp = () => {
    nearRoofUpRef.current += 1;
    onRoofActionChange?.("up");
  };

  const exitRoofUp = () => {
    nearRoofUpRef.current = Math.max(0, nearRoofUpRef.current - 1);
    if (nearRoofUpRef.current === 0) {
      onRoofActionChange?.(null);
    }
  };

  const enterRoofDown = () => {
    nearRoofDownRef.current += 1;
    onRoofActionChange?.("down");
  };

  const exitRoofDown = () => {
    nearRoofDownRef.current = Math.max(0, nearRoofDownRef.current - 1);
    if (nearRoofDownRef.current === 0) {
      onRoofActionChange?.(null);
    }
  };

  return (
    <>
      <CuboidCollider
        sensor
        args={[0.2, 1.2, 0.4]}
        position={[-1.42, 4, -6.37]}
        onIntersectionEnter={enterRoofUp}
        onIntersectionExit={exitRoofUp}
      />
      <CuboidCollider
        sensor
        args={[0.4, 0.8, 0.35]}
        position={[-1.6, 6.25, -6.3]}
        onIntersectionEnter={enterRoofDown}
        onIntersectionExit={exitRoofDown}
      />
      <CuboidCollider
        sensor
        args={[3.4, 5, 2.1]}
        position={[-0.04, 1.4, -5]}
        onIntersectionEnter={enterInside}
        onIntersectionExit={exitInside}
      />
      <CuboidCollider
        sensor
        args={[1.2, 1.2, 0.7]}
        position={[0.05, 3.9, -2.8]}
        onIntersectionEnter={enterInside}
        onIntersectionExit={exitInside}
      />
      {/* Входная дверь */}
      {/* <CuboidCollider
        args={[0.375, 1.03, 0.02]}
        position={[-0.0015, 1.212, -2.998]}
      /> */}
      {/* левая часть фасада */}
      <CuboidCollider
        args={[1.21, 2.8, 0.082]}
        position={[-2.24, 2.5, -2.993]}
      />

      {/* правая часть фасада */}
      <CuboidCollider
        args={[1.13, 2.8, 0.082]}
        position={[2.24, 2.5, -2.993]}
      />

      {/* левая часть фасада у входа */}
      <CuboidCollider
        args={[0.4, 1.4, 0.082]}
        position={[-0.785, 1.3, -2.993]}
      />

      {/* правая часть фасада у входа */}
      <CuboidCollider
        args={[0.4, 1.4, 0.082]}
        position={[0.785, 1.3, -2.993]}
      />

      {/* Перемычка над дверью */}
      <CuboidCollider args={[0.4, 0.18, 0.082]} position={[0, 2.44, -2.993]} />

      {/* Задняя часть фасада */}
      <CuboidCollider
        args={[3.3, 2.8, 0.075]}
        position={[-0.035, 2.5, -7.01]}
      />
      {/* Левая часть фасада */}
      <CuboidCollider
        args={[2.05, 2.8, 0.075]}
        position={[-3.37, 2.5, -5.035]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      {/* Правая часть фасада */}
      <CuboidCollider
        args={[2.05, 2.8, 0.075]}
        position={[3.29, 2.5, -5.035]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      {/* Первый этаж */}
      <CuboidCollider args={[3.4, 0.13, 2]} position={[-0.04, -0.045, -5]} />

      {/* Второй этаж 1 */}
      <CuboidCollider
        args={[3.4, 0.092, 0.5]}
        position={[-0.04, 2.731, -6.54]}
      />

      {/* Второй этаж 2 */}
      <CuboidCollider
        args={[2.86, 0.092, 1.1]}
        position={[0.38, 2.731, -4.98]}
      />

      {/* Второй этаж 3 */}
      <CuboidCollider
        args={[1.245, 0.092, 0.9]}
        position={[0.045, 2.731, -3]}
      />

      {/* Второй этаж 4 */}
      <CuboidCollider args={[1, 0.092, 0.5]} position={[2.25, 2.731, -3.5]} />

      {/* Крыша */}
      <CuboidCollider
        args={[3.48, 0.088, 1.61]}
        position={[-0.04, 5.38, -4.45]}
        rotation={[0, 0, 0]}
      />

      {/* Крыша */}
      <CuboidCollider
        args={[0.24, 0.088, 3.48]}
        position={[-0.04, 5.38, -6.924]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Крыша */}
      <CuboidCollider
        args={[0.4, 0.088, 0.755]}
        position={[-2.76, 5.38, -6.37]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Крыша */}
      <CuboidCollider
        args={[0.4, 0.088, 2.4]}
        position={[1.04, 5.38, -6.37]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Крыша */}
      <CuboidCollider
        args={[0.48, 0.083, 1.9]}
        position={[2.165, 5.91, -5.04]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
      <CuboidCollider
        args={[0.48, 0.083, 1.9]}
        position={[-2.085, 5.91, -5.04]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
      <CuboidCollider
        args={[0.48, 0.083, 2.2]}
        position={[0.05, 5.91, -6.85]}
        rotation={[0, Math.PI * 0.5, Math.PI * 0.5]}
      />
      <CuboidCollider
        args={[0.48, 0.083, 2.2]}
        position={[0.05, 5.91, -3.23]}
        rotation={[0, Math.PI * 0.5, Math.PI * 0.5]}
      />

      {/* Карниз на балконе */}
      <CuboidCollider
        args={[0.6, 0.02, 1.244]}
        position={[0.04, 5.26, -2.36]}
        rotation={[Math.PI * 0.5, Math.PI * 0.5, Math.PI * 0.5]}
      />
      <CuboidCollider
        args={[0.05, 0.02, 1.244]}
        position={[0.04, 5.3, -2.9]}
        rotation={[0, Math.PI * 0.5, Math.PI * 0.5]}
      />

      {/* Правая часть балкона */}
      <CuboidCollider
        args={[0.45, 0.5, 0.09]}
        position={[1.2, 3.247, -2.56]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Центр балкона */}
      <CuboidCollider
        args={[1.24, 0.5, 0.09]}
        position={[0.05, 3.247, -2.185]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Левая часть балкона */}
      <CuboidCollider
        args={[0.45, 0.5, 0.085]}
        position={[-1.12, 3.247, -2.545]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* правая часть двери на балкон */}
      <CuboidCollider
        args={[0.38, 1.3, 0.082]}
        position={[0.802, 4.1, -3.88]}
      />

      {/* левая часть двери на балкон */}
      <CuboidCollider
        args={[0.38, 1.3, 0.082]}
        position={[-0.722, 4.1, -3.88]}
      />

      {/* Перемычка над дверью на балкон */}
      <CuboidCollider
        args={[0.4, 0.25, 0.082]}
        position={[0.05, 5.152, -3.88]}
      />

      {/* фронтально-левая часть стены на балконе */}
      <CuboidCollider
        args={[0.38, 1.3, 0.082]}
        position={[-1.115, 4.1, -3.4]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* фронтально-правая часть стены на балконе */}
      <CuboidCollider
        args={[0.54, 1.3, 0.082]}
        position={[1.205, 4.1, -3.422]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Перегородка между гостиной и кухней */}
      <CuboidCollider
        args={[1.45, 1.3, 0.082]}
        position={[0.72, 1.4, -4.485]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Перегородка между гостиной и кухней 2 */}
      <CuboidCollider
        args={[0.12, 1.3, 0.082]}
        position={[0.72, 1.4, -6.827]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Перегородка между гостиной и кухней верх */}
      <CuboidCollider
        args={[0.4, 0.2, 0.082]}
        position={[0.72, 2.46, -6.32]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Стена у лестницы первый этаж */}
      <CuboidCollider
        args={[1.1, 1.3, 0.082]}
        position={[-2.404, 1.4, -5]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Стена у лестницы первый этаж 2 */}
      <CuboidCollider
        args={[0.5, 1.3, 0.03]}
        position={[-2.82, 1.4, -6.07]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Стена у лестницы первый этаж 3 */}
      <CuboidCollider
        args={[0.48, 1.3, 0.082]}
        position={[-2.005, 1.4, -3.958]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Диван */}
      <CuboidCollider
        args={[0.845, 0.2, 0.395]}
        position={[-1.88, 0.4, -4.9]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      <CuboidCollider
        args={[0.848, 0.15, 0.35]}
        position={[-2.13, 0.6, -4.9]}
        rotation={[Math.PI * 0.5, 0, Math.PI * 0.5]}
      />

      {/* Стеллаж первый этаж */}
      <CuboidCollider
        args={[1, 0.225, 0.38]}
        position={[-2.92, 1.16, -6.515]}
        rotation={[0, 0, Math.PI * 0.5]}
      />

      {/* Кухня */}
      <CuboidCollider
        args={[1, 0.22, 1.9]}
        position={[2.99, 1.16, -5]}
        rotation={[0, 0, Math.PI * 0.5]}
      />

      {/* Телевизор */}
      <CuboidCollider
        args={[0.33, 0.05, 0.52]}
        position={[0.615, 1.76, -4.54]}
        rotation={[0, 0, Math.PI * 0.5]}
      />

      {/* Лампы в гостинной */}
      <BallCollider
        args={[0.12]}
        position={[0.55, 1.86, -3.8]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
      <BallCollider
        args={[0.12]}
        position={[0.55, 1.86, -5.32]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
      {/* Лампы в спальне */}
      <BallCollider
        args={[0.12]}
        position={[0.9, 4.46, -5.11]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
      <BallCollider
        args={[0.12]}
        position={[3.15, 4.46, -5.12]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
      {/* Лампа на втором этаже у лестницы */}
      <BallCollider
        args={[0.12]}
        position={[-1.35, 4.5, -5.55]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
      {/* Раковина */}
      <BallCollider
        args={[0.21]}
        position={[-1.07, 3.6, -6.02]}
        rotation={[0, 0, Math.PI * 0.5]}
      />

      {/* Лестница */}
      <CuboidCollider
        args={[0.8, 0.01, 0.4]}
        position={[-1.87, 0.55, -3.47]}
        rotation={[0, 0, -0.64]}
      />
      <CuboidCollider
        args={[1.5, 0.01, 0.4]}
        position={[-2.885, 1.92, -4.9]}
        rotation={[0, Math.PI * 1.5, -0.64]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-1.703, 0.253, -3.5]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-1.943, 0.429, -3.5]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.183, 0.605, -3.5]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.423, 0.781, -3.5]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.42]}
        position={[-2.904, 0.957, -3.5]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 1.133, -4.057]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 1.309, -4.298]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 1.485, -4.539]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 1.661, -4.779]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 1.837, -5.019]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 2.013, -5.26]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 2.189, -5.5]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 2.365, -5.741]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.14]}
        position={[-2.9, 2.541, -5.98]}
        rotation={[0, Math.PI, 0]}
      />
      <CuboidCollider
        args={[0.45, 0.1, 0.01]}
        position={[-2.9, 2.722, -6.048]}
        rotation={[0, Math.PI, 0]}
      />
      {/* Перила */}
      <CuboidCollider
        args={[0.08, 0.467, 1.12]}
        position={[-2.365, 3.28, -5]}
        rotation={[0, 0, 0]}
      />
      <CuboidCollider
        args={[0.059, 0.467, 0.6]}
        position={[-1.8, 3.28, -3.94]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Лестница на крышу */}
      <CuboidCollider
        args={[0.043, 1.48, 0.27]}
        position={[-1.4, 4.15, -6.37]}
        rotation={[0, 0, 0]}
      />
      {/* Ванная */}
      <CuboidCollider
        args={[0.33, 0.27, 0.8]}
        position={[0.32, 3.05, -6.05]}
        rotation={[0, 0, 0]}
      />
      {/* Унитаз */}
      <CuboidCollider
        args={[0.25, 0.35, 0.12]}
        position={[-0.9, 3.1, -6.59]}
        rotation={[0, 0, 0]}
      />

      {/* правая часть двери на балкон */}
      <CuboidCollider
        args={[0.45, 1.3, 0.082]}
        position={[0.222, 4.1, -5.161]}
      />

      {/* левая часть двери на балкон */}
      <CuboidCollider
        args={[0.14, 1.3, 0.082]}
        position={[-1.14, 4.1, -5.161]}
      />

      {/* Перемычка над дверью на балкон */}
      <CuboidCollider
        args={[0.4, 0.25, 0.082]}
        position={[-0.61, 5.152, -5.161]}
      />

      {/* левая часть санузла */}
      <CuboidCollider
        args={[0.9, 1.3, 0.082]}
        position={[-1.198, 4.1, -6.12]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Правая часть санузла */}
      <CuboidCollider
        args={[1.05, 1.3, 0.083]}
        position={[0.721, 4.1, -5.91]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Перемычка над дверью в спальню */}
      <CuboidCollider
        args={[0.5, 0.25, 0.082]}
        position={[0.721, 5.152, -4.4]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* у двери в спальню маленький столбик справа */}
      <CuboidCollider
        args={[0.1, 1.3, 0.082]}
        position={[0.721, 4.1, -3.992]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Левая подпорка карниза балкона */}
      <CuboidCollider
        args={[0.032, 0.8, 0.032]}
        position={[1.18, 4.45, -2.164]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      {/* Правая подпорка карниза балкона */}
      <CuboidCollider
        args={[0.032, 0.8, 0.032]}
        position={[-1.105, 4.45, -2.164]}
        rotation={[0, Math.PI * 0.5, 0]}
      />
      {/* Правая подпорка карниза балкона - наискосок */}
      <CuboidCollider
        args={[0.02, 0.37, 0.02]}
        position={[-1.105, 4.95, -1.98]}
        rotation={[Math.PI * 0.175, Math.PI * 0.5, 0]}
      />
      {/* Левая подпорка карниза балкона - наискосок */}
      <CuboidCollider
        args={[0.02, 0.37, 0.02]}
        position={[1.18, 4.95, -1.98]}
        rotation={[Math.PI * 0.175, Math.PI * 0.5, 0]}
      />
      {/* Левая колонна */}
      <CylinderCollider args={[1.5, 0.13]} position={[1.085, 1.2, -2.315]} />

      {/* Правая колонна */}
      <CylinderCollider args={[1.5, 0.13]} position={[-1.01, 1.2, -2.315]} />

      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[1.74, 1.6, -2.87]}
      />

      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[-1.74, 1.6, -2.87]}
      />

      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[1.74, 4.24, -2.87]}
      />

      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[-1.74, 4.24, -2.87]}
      />

      {/* Окна на задней части дома */}
      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[1.74, 1.6, -7.13]}
      />

      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[-1.74, 1.6, -7.13]}
      />

      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[1.74, 4.24, -7.13]}
      />

      {/* Окно */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[0.07, 0.62, 0.3]}
        position={[-1.74, 4.24, -7.13]}
      />

      {/* Кухня шкафчики */}
      <CuboidCollider args={[0.25, 1.4, 2]} position={[2.97, 1.3, -5]} />
      {/* Кухня стол */}
      <CuboidCollider args={[0.25, 0.4, 0.6]} position={[1.555, 0.5, -4.06]} />

      {/* Кухня левый стул */}
      <CuboidCollider
        args={[0.14, 0.5, 0.11]}
        position={[2.08, 0.6, -3.47]}
        rotation={[0, Math.PI * 0.48, 0]}
      />
      {/* Кухня правый стул */}
      <CuboidCollider
        args={[0.14, 0.5, 0.11]}
        position={[1.1, 0.6, -3.98]}
        rotation={[0, Math.PI * 0.18, 0]}
      />
      {/* Спальня стул */}
      <CuboidCollider
        args={[0.26, 0.65, 0.23]}
        position={[2.7, 3.45, -3.6]}
        rotation={[0, Math.PI * 0.34, 0]}
      />
      {/* Балкон стул */}
      <CuboidCollider
        args={[0.14, 0.5, 0.11]}
        position={[-0.73, 3.3, -3.27]}
        rotation={[0, Math.PI * 0.73, 0]}
      />
      {/* Балкон тумбочка */}
      <CuboidCollider
        args={[0.16, 0.3, 0.14]}
        position={[0.88, 3, -3.5]}
        rotation={[0, Math.PI * 0.5, 0]}
      />

      {/* Ящики на крыше */}
      <CuboidCollider
        args={[0.19, 0.23, 0.21]}
        position={[-1.49, 6.17, -4.11]}
        rotation={[0, Math.PI * 0.09, 0]}
      />
      <CuboidCollider
        args={[0.19, 0.23, 0.21]}
        position={[-1.13, 5.7, -4.15]}
        rotation={[0, Math.PI * 0.52, 0]}
      />
      <CuboidCollider
        args={[0.19, 0.23, 0.21]}
        position={[-1.55, 5.7, -4.4]}
        rotation={[0, Math.PI * 0.43, 0]}
      />
      <CuboidCollider
        args={[0.19, 0.23, 0.21]}
        position={[-1.54, 5.7, -3.95]}
        rotation={[0, Math.PI * 0.52, 0]}
      />

      {/* Заглушка для щёлки на двери в санузел */}
      <mesh castShadow receiveShadow position={[-0.15, 3.9, -5.165]}>
        <boxGeometry args={[0.1, 2.2, 0.164]} />
        <meshStandardMaterial color="#887961" />
      </mesh>

      {/* норка */}
      <CuboidCollider args={[0.1, 1, 0.082]} position={[-1.8, 1, 4]} />
      <CuboidCollider args={[0.1, 1, 0.082]} position={[-1, 1, 4]} />
      <CuboidCollider
        args={[0.1, 0.6, 0.082]}
        position={[-1.4, 1.15, 4]}
        rotation={[0, 0, Math.PI * 0.5]}
      />

      {/* Кровать */}
      <CuboidCollider
        rotation={[0, Math.PI * 0.5, 0]}
        args={[1, 0.2, 0.7]}
        position={[2.6, 3, -5.95]}
      />

      {/* Шкаф */}
      <CuboidCollider
        rotation={[0, 0, Math.PI * 0.5]}
        args={[1, 0.25, 0.55]}
        position={[1.01, 3.8, -5.97]}
      />

      {/* норка в полный рост */}
      <CuboidCollider args={[0.1, 1, 0.082]} position={[-3.8, 1, 4]} />
      <CuboidCollider args={[0.1, 1, 0.082]} position={[-3, 1, 4]} />
      <CuboidCollider
        args={[0.1, 0.6, 0.082]}
        position={[-3.4, 1.75, 4]}
        rotation={[0, 0, Math.PI * 0.5]}
      />
    </>
  );
}