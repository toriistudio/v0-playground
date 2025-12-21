"use client";

import { useRef } from "react";
import {
  Playground,
  useControls,
  type UploadedMedia,
} from "@toriistudio/v0-playground";

const DEFAULT_IMAGE = "/v0.png";

function ImagePreview() {
  const selectMediaRef = useRef<(media: UploadedMedia) => void>(
    () => undefined
  );
  const clearMediaRef = useRef<() => void>(() => undefined);

  const { previewUrl, setValue } = useControls(
    {
      previewUrl: {
        type: "string",
        value: DEFAULT_IMAGE,
        hidden: true,
      },
    },
    {
      componentName: "ImagePreview",
      config: {
        mainLabel: "Image Controls",
        showCopyButton: false,
        showPresentationButton: true,
        addMediaUploadControl: {
          folder: "Media",
          folderPlacement: "top",

          onSelectMedia: (media) => selectMediaRef.current(media),
          onClear: () => clearMediaRef.current(),
        },
      },
    }
  );

  selectMediaRef.current = (media) => {
    setValue("previewUrl", media.src);
  };

  clearMediaRef.current = () => {
    setValue("previewUrl", DEFAULT_IMAGE);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <img
        src={previewUrl}
        alt="Preview"
        className="rounded shadow-lg max-w-xs max-h-[300px] object-contain"
      />
    </div>
  );
}

export default function App() {
  return (
    <Playground>
      <ImagePreview />
    </Playground>
  );
}
