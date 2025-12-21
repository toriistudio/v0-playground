import type { UploadedMedia } from "@/types/media";

export type MediaSelectionSnapshot = {
  media: UploadedMedia | null;
  error: string | null;
};

let snapshot: MediaSelectionSnapshot = {
  media: null,
  error: null,
};

const listeners = new Set<() => void>();

const emitChange = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const mediaSelectionStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  setSnapshot: (next: MediaSelectionSnapshot) => {
    snapshot = next;
    emitChange();
  },
};
