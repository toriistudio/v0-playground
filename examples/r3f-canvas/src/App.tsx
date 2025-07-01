import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

import { PlaygroundCanvas, useControls } from "@toriistudio/v0-playground";

function SpinningBox() {
  const { color } = useControls({
    color: { type: "color", value: "#ff1b6f" },
  });

  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta;
      ref.current.rotation.y += delta;
    }
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function App() {
  return (
    <PlaygroundCanvas>
      <SpinningBox />
    </PlaygroundCanvas>
  );
}
