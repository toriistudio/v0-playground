"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ResizableLayout } from "@/context/ResizableLayout";
import { ControlsProvider } from "@/context/ControlsContext";
import ControlPanel from "@/components/ControlPanel";
import PreviewContainer from "@/components/PreviewContainer";
import {
  CONTROLS_ONLY_PARAM,
  NO_CONTROLS_PARAM,
  PRESENTATION_PARAM,
} from "@/constants/urlParams";

const HiddenPreview = ({ children }: { children: ReactNode }) => (
  <div aria-hidden="true" className="hidden">
    {children}
  </div>
);

export default function Playground({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { showControls, isPresentationMode, isControlsOnly } = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        showControls: true,
        isPresentationMode: false,
        isControlsOnly: false,
      };
    }
    const params = new URLSearchParams(window.location.search);
    const presentation = params.get(PRESENTATION_PARAM) === "true";
    const controlsOnly = params.get(CONTROLS_ONLY_PARAM) === "true";
    const noControlsParam = params.get(NO_CONTROLS_PARAM) === "true";
    const showControlsValue = controlsOnly || (!presentation && !noControlsParam);
    return {
      showControls: showControlsValue,
      isPresentationMode: presentation,
      isControlsOnly: controlsOnly,
    };
  }, []);
  const shouldShowShareButton = !showControls && !isPresentationMode;
  const layoutHideControls = !showControls || isControlsOnly;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isHydrated) return null;

  return (
    <ResizableLayout hideControls={layoutHideControls}>
      <ControlsProvider>
        {shouldShowShareButton && (
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 z-50 flex items-center gap-1 rounded bg-black/70 px-3 py-1 text-white hover:bg-black"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Share"}
          </button>
        )}
        {isControlsOnly ? (
          <HiddenPreview>{children}</HiddenPreview>
        ) : (
          <PreviewContainer hideControls={layoutHideControls}>
            {children}
          </PreviewContainer>
        )}
        {showControls && <ControlPanel />}
      </ControlsProvider>
    </ResizableLayout>
  );
}
