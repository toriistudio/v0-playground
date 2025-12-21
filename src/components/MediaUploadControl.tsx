"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { X } from "lucide-react";

import { mediaSelectionStore } from "@/state/mediaSelectionStore";
import type { PresetMediaEntry, UploadedMedia } from "@/types/media";

const DEFAULT_PRESET_MEDIA: PresetMediaEntry[] = [
  {
    src: "/v0.png",
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

type MediaUploadControlProps = {
  onSelectMedia: (media: UploadedMedia) => void;
  onClear: () => void;
  presetMedia?: PresetMediaEntry[];
  maxPresetCount?: number;
};

export default function MediaUploadControl({
  onSelectMedia,
  onClear,
  presetMedia,
  maxPresetCount,
}: MediaUploadControlProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);

  const { media, error } = useSyncExternalStore(
    mediaSelectionStore.subscribe,
    mediaSelectionStore.getSnapshot,
    mediaSelectionStore.getSnapshot
  );

  const VIDEO_EXTENSIONS = useMemo(
    () => [".mp4", ".webm", ".ogg", ".ogv", ".mov", ".m4v"],
    []
  );

  const setSelection = useCallback(
    (next: { media: UploadedMedia | null; error: string | null }) => {
      mediaSelectionStore.setSnapshot(next);
    },
    []
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (uploadedUrlRef.current) {
      URL.revokeObjectURL(uploadedUrlRef.current);
      uploadedUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    uploadedUrlRef.current = objectUrl;

    const lowerName = file.name?.toLowerCase() ?? "";
    const hasVideoExtension = VIDEO_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );
    const isVideo = file.type.startsWith("video/") || hasVideoExtension;
    if (isVideo) {
      setSelection({
        media: null,
        error: "Videos are not supported in this effect yet.",
      });
      return;
    }

    const nextMedia: UploadedMedia = { src: objectUrl, type: "image" };
    setSelection({ media: nextMedia, error: null });
    onSelectMedia(nextMedia);
  };

  const handleClearSelection = () => {
    if (uploadedUrlRef.current) {
      URL.revokeObjectURL(uploadedUrlRef.current);
      uploadedUrlRef.current = null;
    }
    setSelection({ media: null, error: null });
    onClear();
  };

  const handlePresetSelect = (entry: PresetMediaEntry) => {
    if (entry.type === "video") {
      setSelection({
        media: null,
        error: "Videos are not supported in this effect yet.",
      });
      return;
    }

    const nextMedia: UploadedMedia = { src: entry.src, type: entry.type };
    setSelection({ media: nextMedia, error: null });
    onSelectMedia(nextMedia);
  };

  useEffect(() => {
    return () => {
      if (uploadedUrlRef.current) {
        URL.revokeObjectURL(uploadedUrlRef.current);
        uploadedUrlRef.current = null;
      }
    };
  }, []);

  const presets = useMemo(() => {
    const source = presetMedia ?? DEFAULT_PRESET_MEDIA;
    if (typeof maxPresetCount === "number" && Number.isFinite(maxPresetCount)) {
      const safeCount = Math.max(0, Math.floor(maxPresetCount));
      return source.slice(0, safeCount);
    }
    return source;
  }, [presetMedia, maxPresetCount]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <label htmlFor={inputId} style={{ fontSize: "0.85rem", fontWeight: 500 }}>
        Upload media
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            padding: "0.35rem 0.75rem",
            borderRadius: "0.4rem",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Choose file
        </button>
        {media ? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "0.35rem",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <img
              src={media.src}
              alt="Thumbnail"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ) : null}
        {media ? (
          <button
            type="button"
            onClick={handleClearSelection}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.3rem",
              borderRadius: "0.4rem",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
            aria-label="Clear selection"
            title="Clear selection"
          >
            <X size={16} strokeWidth={2} />
          </button>
        ) : null}
      </div>
      {presets.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.5rem",
          }}
        >
          {presets.map((entry) => {
            const isSelected =
              media?.src === entry.src && media?.type === entry.type;
            return (
              <button
                key={`${entry.src}-${entry.type}`}
                type="button"
                onClick={() => handlePresetSelect(entry)}
                style={{
                  width: "100%",
                  borderRadius: "0.4rem",
                  border: "1px solid rgba(255,255,255,0.25)",
                  outline: isSelected ? "2px solid #fff" : "none",
                  outlineOffset: 2,
                  padding: 0,
                  overflow: "hidden",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <img
                  src={entry.src}
                  alt={entry.label}
                  style={{
                    width: "100%",
                    height: 100,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    display: "block",
                    padding: "0.35rem",
                    fontSize: "0.75rem",
                    textAlign: "left",
                    background: "rgba(0,0,0,0.45)",
                  }}
                >
                  {entry.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      {error ? (
        <p style={{ color: "#ff9da4", fontSize: "0.8rem" }}>{error}</p>
      ) : null}
    </div>
  );
}
