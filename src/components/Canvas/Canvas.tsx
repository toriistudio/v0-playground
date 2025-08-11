"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas as ThreeCanvas, useThree } from "@react-three/fiber";
import "@react-three/fiber";

import CameraLogger from "@/components/CameraLogger";

export type CanvasMediaProps = {
  debugOrbit?: boolean;
  size: { width: number; height: number } | null;
};

type CanvasProps = {
  mediaProps?: CanvasMediaProps;
  children: React.ReactNode;
};

const ResponsiveCamera = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  const { camera } = useThree();

  useEffect(() => {
    const isMobile = width < 768;
    const zoomFactor = isMobile ? 70 : 100;
    camera.position.z = height / zoomFactor;
    camera.updateProjectionMatrix();
  }, [height, camera, width]);

  return null;
};

const Canvas: React.FC<CanvasProps> = ({
  mediaProps,
  children,
  ...otherProps
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [parentSize, setParentSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    let observer: ResizeObserver | null = null;

    const tryObserve = () => {
      const node = canvasRef.current;
      if (!node || !node.parentElement) {
        setTimeout(tryObserve, 50);
        return;
      }

      const parent = node.parentElement;

      observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setParentSize({ width, height });
      });

      observer.observe(parent);
    };

    tryObserve();

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  const mergedMediaProps = {
    ...(mediaProps || {}),
    size: mediaProps?.size || { width: 400, height: 400 },
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full pointer-events-none relative touch-none"
    >
      <ThreeCanvas
        resize={{ polyfill: ResizeObserver }}
        style={{ width: parentSize?.width, height: parentSize?.height }}
        gl={{ preserveDrawingBuffer: true }}
        {...otherProps}
      >
        {parentSize?.height && parentSize?.width && (
          <ResponsiveCamera
            height={parentSize.height}
            width={parentSize.width}
          />
        )}
        {mediaProps?.debugOrbit && <CameraLogger />}
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        {React.cloneElement(children as React.ReactElement, mergedMediaProps)}
      </ThreeCanvas>
    </div>
  );
};

export default Canvas;
