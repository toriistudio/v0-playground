import React, { useRef } from "react";
import { useResizableLayout } from "@/context/ResizableLayout";

type Props = {
  children?: React.ReactNode;
  hideControls?: boolean;
};

const PreviewContainer: React.FC<Props> = ({ children, hideControls }) => {
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
      {children}
    </div>
  );
};

export default PreviewContainer;
