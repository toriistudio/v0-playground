export type MediaType = "image" | "video";

export type UploadedMedia = {
  src: string;
  type: MediaType;
};

export type PresetMediaEntry = {
  src: string;
  label: string;
  type: MediaType;
};
