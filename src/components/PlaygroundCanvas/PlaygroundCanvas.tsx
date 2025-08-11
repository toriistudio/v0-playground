"use client";

import React, { ReactNode } from "react";
import Playground from "@/components/Playground";
import Canvas, { CanvasMediaProps } from "@/components/Canvas";

export type PlaygroundCanvasProps = {
  children: React.ReactNode;
  mediaProps?: CanvasMediaProps;
};

const PlaygroundCanvas: React.FC<PlaygroundCanvasProps> = ({
  children,
  mediaProps,
  ...otherProps
}) => {
  return (
    <Playground>
      <Canvas mediaProps={mediaProps} {...otherProps}>
        {children}
      </Canvas>
    </Playground>
  );
};

export default PlaygroundCanvas;
