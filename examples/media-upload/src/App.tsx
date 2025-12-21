"use client";

import React, { useRef } from "react";
import {
  Playground,
  useControls,
  type PresetMediaEntry,
  type UploadedMedia,
} from "@toriistudio/v0-playground";

const DEFAULT_IMAGE = "/v0.png";

const PRESET_MEDIA: PresetMediaEntry[] = [
  {
    src: DEFAULT_IMAGE,
    label: "Default",
    type: "image",
  },
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=240&auto=format&fit=crop",
    label: "Mountains",
    type: "image",
  },
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=240&auto=format&fit=crop",
    label: "Beach",
    type: "image",
  },
  {
    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=240&auto=format&fit=crop",
    label: "City",
    type: "image",
  },
];

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
          presetMedia: PRESET_MEDIA,
          maxPresetCount: PRESET_MEDIA.length,
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
