"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { GripVertical } from "lucide-react";

// Define context shape
type ResizableLayoutContextType = {
  leftPanelWidth: number;
  isHydrated: boolean;
  isDesktop: boolean;
  sidebarNarrow: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

// Create context
const ResizableLayoutContext = createContext<ResizableLayoutContextType | null>(
  null
);

// Hook to access context
export const useResizableLayout = () => {
  const ctx = useContext(ResizableLayoutContext);
  if (!ctx) throw new Error("ResizableLayoutContext not found");
  return ctx;
};

// Layout wrapper with resize logic
export const ResizableLayout = ({
  children,
  hideControls,
}: {
  children: ReactNode;
  hideControls: boolean;
}) => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(25); // %
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarNarrow, setSidebarNarrow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hydration + desktop detection
  useEffect(() => {
    setIsHydrated(true);
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar width check
  useEffect(() => {
    if (!isHydrated || !isDesktop) return;

    const checkSidebarWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const sidebarWidth = (leftPanelWidth / 100) * containerWidth;
        setSidebarNarrow(sidebarWidth < 350);
      }
    };

    checkSidebarWidth();
    window.addEventListener("resize", checkSidebarWidth);
    return () => window.removeEventListener("resize", checkSidebarWidth);
  }, [leftPanelWidth, isHydrated, isDesktop]);

  // Dragging logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeftWidth =
          ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newLeftWidth >= 20 && newLeftWidth <= 80) {
          setLeftPanelWidth(newLeftWidth);
        }
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <ResizableLayoutContext.Provider
      value={{
        leftPanelWidth,
        isHydrated,
        isDesktop,
        sidebarNarrow,
        containerRef,
      }}
    >
      <div className="min-h-screen w-full bg-black text-white">
        <div
          ref={containerRef}
          className="flex flex-col md:flex-row min-h-screen w-full overflow-hidden select-none"
        >
          {children}

          {isHydrated && isDesktop && !hideControls && (
            <div
              className="order-3 w-2 bg-stone-800 hover:bg-stone-700 cursor-col-resize items-center justify-center z-10 transition-opacity duration-300"
              onMouseDown={() => setIsDragging(true)}
              style={{
                position: "absolute",
                left: `${leftPanelWidth}%`,
                top: 0,
                bottom: 0,
                display: "flex",
              }}
            >
              <GripVertical className="h-6 w-6 text-stone-500" />
            </div>
          )}
        </div>
      </div>
    </ResizableLayoutContext.Provider>
  );
};
