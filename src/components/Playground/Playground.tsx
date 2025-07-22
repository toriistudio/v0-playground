"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ResizableLayout } from "@/context/ResizableLayout";
import { ControlsProvider } from "@/context/ControlsContext";
import ControlPanel from "@/components/ControlPanel";
import PreviewContainer from "@/components/PreviewContainer";

const NO_CONTROLS_PARAM = "nocontrols";

export default function Playground({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const hideControls = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      new URLSearchParams(window.location.search).get(NO_CONTROLS_PARAM) ===
      "true"
    );
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isHydrated) return null;

  return (
    <ResizableLayout hideControls={hideControls}>
      <ControlsProvider>
        {hideControls && (
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 z-50 flex items-center gap-1 rounded bg-black/70 px-3 py-1 text-white hover:bg-black"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Share"}
          </button>
        )}
        <PreviewContainer hideControls={hideControls}>
          {children}
        </PreviewContainer>
        {!hideControls && <ControlPanel />}
      </ControlsProvider>
    </ResizableLayout>
  );
}
