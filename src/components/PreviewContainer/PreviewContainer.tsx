import React, { useRef } from "react";
import { useResizableLayout } from "@/context/ResizableLayout";
import { useControlsContext } from "@/context/ControlsContext";
import Grid from "@/components/Grid";

type Props = {
  children?: React.ReactNode;
  hideControls?: boolean;
};

const PreviewContainer: React.FC<Props> = ({ children, hideControls }) => {
  const { config } = useControlsContext();
  const { leftPanelWidth, isDesktop, isHydrated, containerRef } =
    useResizableLayout();
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={previewRef}
      className="order-1 md:order-2 flex-1 bg-black overflow-auto flex items-center justify-center relative"
      style={
        isHydrated && isDesktop && !hideControls
          ? {
              width: `${100 - leftPanelWidth}%`,
              marginLeft: `${leftPanelWidth}%`,
            }
          : {}
      }
    >
      <div className="w-screen h-screen">
        {config?.showGrid && <Grid />}
        <div className="w-screen h-screen flex items-center justify-center relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PreviewContainer;
