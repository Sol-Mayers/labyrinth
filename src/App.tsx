import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { Canvas } from "@react-three/fiber";
import Experience from "./components/Experience";
import generateLabyrinth, { type Labyrinth } from "./core/generateLabyrinth";
import { Sky, Stats } from "@react-three/drei";
import * as THREE from "three";
import { Physics } from "@react-three/rapier";
import PlayerStatusHud from "./components/Player/PlayerStatusHUD/PlayerStatusHud";
import { EffectComposer, FXAA } from "@react-three/postprocessing";

const GL_PROPS = {
  antialias: false,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.2,
  powerPreference: "high-performance" as const,
  stencil: false,
  depth: true,
} as const;

const SKY_POSITION: [number, number, number] = [100, 50, 100];

function App() {
  const [labyrinth, setLabyrinth] = useState<Labyrinth>(() =>
    generateLabyrinth(41),
  );
  const [mode, setMode] = useState<"orbit" | "fps">("orbit");
  const [sprintEnergy, setSprintEnergy] = useState(10);

  const cameraSettings = useMemo(
    () => ({
      fov: 60,
      near: 0.1,
      far: 200,
      position: [6, 8, 6] as [number, number, number],
    }),
    [],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && mode === "fps") {
        setMode("orbit");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [mode]);

  const handleGenerate = useCallback(() => {
    setLabyrinth(generateLabyrinth(41));
  }, []);

  const handleModeSwitch = useCallback(() => {
    if (mode === "orbit") {
      document.documentElement.requestFullscreen?.().catch(console.error);
      setMode("fps");
    } else {
      if (document.fullscreenElement) document.exitFullscreen();
      setMode("orbit");
    }
  }, [mode]);

  return (
    <>
      <Canvas
        shadows
        camera={cameraSettings}
        dpr={[1, 1.5]}
        gl={GL_PROPS}
        performance={{ min: 0.5 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color("#a1a1a1");
        }}
      >
        <Stats />

        {/* <Sky
          sunPosition={SKY_POSITION}
          inclination={0.4}
          azimuth={0.8}
          distance={500}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        /> */}

        <Physics gravity={[0, -9.81, 0]} timeStep="vary" interpolate debug>
          <Suspense fallback={null}>
            <Experience
              labyrinth={labyrinth}
              mode={mode}
              setSprintEnergy={setSprintEnergy}
              patchDensity={0.02}
            />
          </Suspense>
        </Physics>

        {/*Антиалиас. Под вопросом! Просадка FPS на 5-10 кадров. */}
        <EffectComposer multisampling={0}>
          <FXAA />
        </EffectComposer>
      </Canvas>

      <PlayerStatusHud
        sprintEnergy={sprintEnergy}
        sprintEnergyMax={10}
        health={100}
        healthMax={100}
      />

      <button
        className="control-menu control-menu-generate"
        onClick={handleGenerate}
      >
        Generate!
      </button>

      <button
        className="control-menu control-menu-check-mode"
        onClick={handleModeSwitch}
      >
        {mode === "orbit" ? "Switch to FPS Mode" : "Switch to Orbit Mode"}
      </button>
    </>
  );
}

export default App;
