import "./PlayerStatusHud.css";

interface PlayerStatusHudProps {
  sprintEnergy: number;
  sprintEnergyMax: number;
  health?: number;
  healthMax?: number;
}

export default function PlayerStatusHud({
  sprintEnergy,
  sprintEnergyMax,
  health = 100,
  healthMax = 100,
}: PlayerStatusHudProps) {
  const sprintPercent = Math.max(
    0,
    Math.min(100, (sprintEnergy / sprintEnergyMax) * 100),
  );

  const healthPercent = Math.max(0, Math.min(100, (health / healthMax) * 100));

  return (
    <div className="hud">
      <div className="hud__bar hud__bar--health">
        <div
          className="hud__fill hud__fill--health"
          style={{ width: `${healthPercent}%` }}
        />
      </div>

      <div className="hud__bar hud__bar--sprint">
        <div
          className="hud__fill hud__fill--sprint"
          style={{ width: `${sprintPercent}%` }}
        />
      </div>
    </div>
  );
}
