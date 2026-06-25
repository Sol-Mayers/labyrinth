import HouseColliders from "./HouseColliders/HouseColliders";
import HouseVisual from "./HouseVisual/HouseVisual";

type HouseProps = {
  onToggleSlowdown: (isInside: boolean) => void;
};

export default function House({ onToggleSlowdown }: HouseProps) {
  return (
    <group>
      <HouseColliders onToggleSlowdown={onToggleSlowdown} />
      <HouseVisual />
    </group>
  );
}
