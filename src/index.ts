// Core exports
export { default as Playground } from "@/components/Playground";
export { Button } from "@/components/ui/button";
export {
  useControls,
  useUrlSyncedControls,
  ControlsProvider,
} from "@/context/ControlsContext";

// Type exports
export type { ControlsSchema, ControlType } from "@/context/ControlsContext";
export {
  computePaletteGradient,
  clonePalette,
  createPaletteSignature,
  createAdvancedPalette,
  advancedPaletteToHexColors,
  hexToPaletteValue,
  paletteValueToHex,
  DEFAULT_ADVANCED_PALETTE,
  DEFAULT_HEX_PALETTE,
  type AdvancedPalette,
  type AdvancedPaletteSource,
  type AdvancedPaletteValueSource,
  type AdvancedPaletteRecordSource,
  type AdvancedPaletteControlConfig,
  type PaletteChannelKey,
} from "@/lib/advancedPalette";
export {
  useAdvancedPaletteControls,
  useDefaultAdvancedPaletteControls,
  type UseAdvancedPaletteControlsOptions,
  type UseAdvancedPaletteControlsResult,
} from "@/hooks/useAdvancedPaletteControls";
