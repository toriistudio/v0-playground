"use client";

import { useRef, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useThree } from "@react-three/fiber";
import { debounce } from "lodash";

export default function CameraLogger() {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const logRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    logRef.current = debounce(() => {
      console.info("Camera position:", camera.position.toArray());
    }, 200);
  }, [camera]);

  useEffect(() => {
    const controls = controlsRef.current;
    const handler = logRef.current;

    if (!controls || !handler) return;

    controls.addEventListener("change", handler);
    return () => controls.removeEventListener("change", handler);
  }, []);

  return <OrbitControls ref={controlsRef} />;
}
