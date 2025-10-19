import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type AdvancedPalette,
  type AdvancedPaletteControlConfig,
  type AdvancedPaletteSource,
  advancedPaletteToHexColors,
  computePaletteGradient,
  clonePalette,
  createAdvancedPalette,
  createPaletteSignature,
  DEFAULT_ADVANCED_PALETTE,
} from "@/lib/advancedPalette";

type ControlOverrides = Omit<
  AdvancedPaletteControlConfig,
  "defaultPalette" | "onPaletteChange"
>;

export type UseAdvancedPaletteControlsOptions = {
  defaultPalette?: AdvancedPaletteSource;
  fallbackPalette?: AdvancedPaletteSource;
  sectionOrder?: string[];
  defaultColor?: string;
  gradientSteps?: number;
  control?: ControlOverrides;
  onChange?: (palette: AdvancedPalette) => void;
};

export type UseAdvancedPaletteControlsResult = {
  palette: Readonly<AdvancedPalette>;
  hexColors: string[];
  controlConfig: AdvancedPaletteControlConfig;
  paletteGradient: string;
  setPalette: (source: AdvancedPaletteSource) => void;
  updatePalette: (
    updater: (current: AdvancedPalette) => AdvancedPaletteSource
  ) => void;
  resetPalette: () => void;
  paletteSignature: string;
};

const cloneForCallbacks = (palette: AdvancedPalette) => clonePalette(palette);

export const useAdvancedPaletteControls = (
  options: UseAdvancedPaletteControlsOptions = {}
): UseAdvancedPaletteControlsResult => {
  const resolvedDefaultPalette = useMemo(
    () => createAdvancedPalette(options.defaultPalette),
    [options.defaultPalette]
  );

  const resolvedFallbackPalette = useMemo(
    () =>
      options.fallbackPalette
        ? createAdvancedPalette(options.fallbackPalette)
        : resolvedDefaultPalette,
    [options.fallbackPalette, resolvedDefaultPalette]
  );

  const [palette, setPaletteState] = useState<AdvancedPalette>(() =>
    clonePalette(resolvedDefaultPalette)
  );

  const defaultSignatureRef = useRef<string>(
    createPaletteSignature(resolvedDefaultPalette)
  );

  useEffect(() => {
    const nextSignature = createPaletteSignature(resolvedDefaultPalette);
    if (defaultSignatureRef.current === nextSignature) return;

    defaultSignatureRef.current = nextSignature;
    setPaletteState(clonePalette(resolvedDefaultPalette));
  }, [resolvedDefaultPalette]);

  const notifyChange = useCallback(
    (nextPalette: AdvancedPalette) => {
      options.onChange?.(cloneForCallbacks(nextPalette));
    },
    [options.onChange]
  );

  const setPalette = useCallback(
    (source: AdvancedPaletteSource) => {
      const nextPalette = createAdvancedPalette(
        source ?? resolvedDefaultPalette
      );
      setPaletteState(clonePalette(nextPalette));
      notifyChange(nextPalette);
    },
    [notifyChange, resolvedDefaultPalette]
  );

  const updatePalette = useCallback(
    (updater: (current: AdvancedPalette) => AdvancedPaletteSource) => {
      setPaletteState((current) => {
        const nextSource = updater(clonePalette(current));
        const nextPalette = createAdvancedPalette(
          nextSource ?? current ?? resolvedDefaultPalette
        );
        notifyChange(nextPalette);
        return clonePalette(nextPalette);
      });
    },
    [notifyChange, resolvedDefaultPalette]
  );

  const resetPalette = useCallback(() => {
    setPaletteState(clonePalette(resolvedDefaultPalette));
    notifyChange(resolvedDefaultPalette);
  }, [notifyChange, resolvedDefaultPalette]);

  const handleControlPaletteChange = useCallback(
    (nextPalette: AdvancedPalette) => {
      setPaletteState(clonePalette(nextPalette));
      notifyChange(nextPalette);
    },
    [notifyChange]
  );

  const controlConfig = useMemo<AdvancedPaletteControlConfig>(
    () => ({
      ...(options.control ?? {}),
      defaultPalette: resolvedDefaultPalette,
      onPaletteChange: handleControlPaletteChange,
    }),
    [handleControlPaletteChange, options.control, resolvedDefaultPalette]
  );

  const hexColors = useMemo(
    () =>
      advancedPaletteToHexColors(palette, {
        sectionOrder: options.sectionOrder,
        fallbackPalette: resolvedFallbackPalette,
        defaultColor: options.defaultColor,
      }),
    [
      options.defaultColor,
      options.sectionOrder,
      palette,
      resolvedFallbackPalette,
    ]
  );

  const paletteSignature = useMemo(
    () => createPaletteSignature(palette),
    [palette]
  );

  const paletteGradient = useMemo(
    () => computePaletteGradient(palette, options.gradientSteps),
    [options.gradientSteps, palette]
  );

  return {
    palette,
    hexColors,
    controlConfig,
    paletteGradient,
    setPalette,
    updatePalette,
    resetPalette,
    paletteSignature,
  };
};

export const useDefaultAdvancedPaletteControls = () =>
  useAdvancedPaletteControls({ defaultPalette: DEFAULT_ADVANCED_PALETTE });
