"use client";

import { ReactNode } from "react";
import { ResizableLayout } from "@/context/ResizableLayout";
import { ControlsProvider } from "@/context/ControlsContext";
import PreviewContainer from "@/components/PreviewContainer";
import ControlPanel from "@/components/ControlPanel";

export default function Playground({ children }: { children: ReactNode }) {
  return (
    <ResizableLayout>
      <ControlsProvider>
        <PreviewContainer>{children}</PreviewContainer>
        <ControlPanel />
      </ControlsProvider>
    </ResizableLayout>
  );
}
