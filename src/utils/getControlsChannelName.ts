import {
  CONTROLS_ONLY_PARAM,
  NO_CONTROLS_PARAM,
  PRESENTATION_PARAM,
} from "@/constants/urlParams";

const EXCLUDED_KEYS = new Set([
  NO_CONTROLS_PARAM,
  PRESENTATION_PARAM,
  CONTROLS_ONLY_PARAM,
]);

export const getControlsChannelName = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  for (const key of EXCLUDED_KEYS) {
    params.delete(key);
  }
  const query = params.toString();
  const base = window.location.pathname || "/";
  return `v0-controls:${base}${query ? `?${query}` : ""}`;
};
