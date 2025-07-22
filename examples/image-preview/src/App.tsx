"use client";

import React, { useRef, useState } from "react";
import { ImageIcon, Download } from "lucide-react";
import { Playground, useUrlSyncedControls } from "@toriistudio/v0-playground";

import { Button } from "@toriistudio/glow-ui";

function ImagePreview() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { previewUrl, setValue } = useUrlSyncedControls(
    {
      previewUrl: {
        type: "string",
        value: "/v0.png",
        hidden: true,
      },
      upload: {
        type: "button",
        render: () => (
          <>
            <Button
              isGlowing={false}
              className="w-full py-2 text-sm bg-stone-700 hover:bg-stone-600 text-white rounded"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="mr-1 w-4 h-4" /> Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setValue("previewUrl", url);
              }}
            />
          </>
        ),
      },
    },
    {
      componentName: "ImagePreview",
      config: {
        mainLabel: "Image Controls",
        showCopyButton: false,
      },
    }
  );

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
