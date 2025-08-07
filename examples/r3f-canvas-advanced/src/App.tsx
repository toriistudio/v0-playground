import { useEffect, useRef } from "react";
import { Upload } from "lucide-react";

import {
  PlaygroundCanvas,
  useControls,
  Button,
} from "@toriistudio/v0-playground";

import { useCompressedImage } from "@/hooks/useCompressedImage";

import CanvasParticles from "@/components/CanvasParticles";

const DEFAULT_PICTURE_URL = "/v0.png";

function InnerPreview() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { base64, processImage } = useCompressedImage();

  useEffect(() => {
    if (base64) {
      setValue("pictureUrl", base64);
    }
  }, [base64]);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const easingFns = {
    linear: (t: number) => t,
    easeInOutCubic: (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  };

  const {
    pictureUrl,
    pointSizeBase,
    displacementStrength,
    glowSizeFactor,
    intensityScale,
    easing,
    color,
    setValue,
  } = useControls({
    pictureUrl: {
      type: "string",
      value: DEFAULT_PICTURE_URL,
      hidden: true,
    },
    pointSizeBase: {
      type: "number",
      value: 0.05,
      min: 0.01,
      max: 1,
      step: 0.01,
    },
    displacementStrength: {
      type: "number",
      value: 3,
      min: 0,
      max: 10,
      step: 0.5,
    },
    glowSizeFactor: {
      type: "number",
      value: 0.25,
      min: 0.05,
      max: 1,
      step: 0.05,
    },
    intensityScale: { type: "number", value: 1, min: 0, max: 5, step: 0.01 },
    color: { type: "color", value: "#ffffff" },
    easing: {
      options: easingFns,
      value: "easeOutCubic",
      type: "select",
    },
    imageUpload: {
      type: "button",
      render: () => (
        <>
          <Button onClick={handleImageUpload}>
            <Upload /> Upload your image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              processImage(file);
            }}
            className="hidden"
          />
        </>
      ),
    },
  });

  return (
    <CanvasParticles
      pointSizeBase={pointSizeBase}
      displacementStrength={displacementStrength}
      glowSizeFactor={glowSizeFactor}
      intensityScale={intensityScale}
      color={color}
      pictureUrl={pictureUrl}
    />
  );
}

export default function App() {
  return (
    <PlaygroundCanvas>
      <InnerPreview />
    </PlaygroundCanvas>
  );
}
