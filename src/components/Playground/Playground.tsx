"use client";

import { ReactNode, useMemo } from "react";
import { ResizableLayout } from "@/context/ResizableLayout";
import { ControlsProvider } from "@/context/ControlsContext";
import PreviewContainer from "@/components/PreviewContainer";
import ControlPanel from "@/components/ControlPanel";

const NO_CONTROLS_PARAM = "nocontrols";

export default function Playground({ children }: { children: ReactNode }) {
  const hideControls = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      new URLSearchParams(window.location.search).get(NO_CONTROLS_PARAM) ===
      "true"
    );
  }, []);

  return (
    <ResizableLayout hideControls={hideControls}>
      <ControlsProvider>
        <PreviewContainer hideControls={hideControls}>
          {children}
        </PreviewContainer>
        {!hideControls && <ControlPanel />}
      </ControlsProvider>
    </ResizableLayout>
  );
}
