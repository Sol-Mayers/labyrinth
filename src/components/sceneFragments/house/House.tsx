import { useState } from "react";
import HouseColliders from "./HouseColliders/HouseColliders";
import HouseVisual from "./HouseVisual/HouseVisual";

type HouseProps = {
  onToggleSlowdown: (isInside: boolean) => void;
  onRoofActionChange?: (action: "up" | "down" | null) => void;
  onRoofMoveRequest?: (action: "up" | "down") => void;
};

export default function House({
  onToggleSlowdown,
  onRoofActionChange,
  onRoofMoveRequest,
}: HouseProps) {
  return (
    <>
      <HouseColliders
        onToggleSlowdown={onToggleSlowdown}
        onRoofActionChange={onRoofActionChange}
        onRoofMoveRequest={onRoofMoveRequest}
      />
      <HouseVisual />
    </>
  );
}