import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useControlsContext } from "@/context/ControlsContext";
import {
  CHANNEL_KEYS,
  computePaletteGradient,
  createPaletteControlKey,
  createPaletteSignature,
  DEFAULT_CHANNEL_LABELS,
  DEFAULT_RANGES,
  toNumberOr,
  type AdvancedPalette,
  type PaletteChannelKey,
  type ResolvedAdvancedPaletteConfig,
} from "@/lib/advancedPalette";

type AdvancedPaletteControlProps = {
  config: ResolvedAdvancedPaletteConfig;
};

const AdvancedPaletteControl: React.FC<AdvancedPaletteControlProps> = ({
  config,
}) => {
  const { values, setValue } = useControlsContext();

  const palette = useMemo<AdvancedPalette>(() => {
    const result: AdvancedPalette = {};
    config.sections.forEach((section) => {
      result[section.key] = CHANNEL_KEYS.reduce((acc, channel) => {
        const key = createPaletteControlKey(
          config.hiddenKeyPrefix,
          section.key,
          channel
        );
        const defaultValue =
          config.defaultPalette?.[section.key]?.[channel] ??
          DEFAULT_RANGES[section.key]?.min ??
          0;
        acc[channel] = toNumberOr(values?.[key], defaultValue);
        return acc;
      }, {} as Record<PaletteChannelKey, number>);
    });
    return result;
  }, [config.defaultPalette, config.hiddenKeyPrefix, config.sections, values]);

  const paletteGradient = useMemo(
    () => computePaletteGradient(palette, config.gradientSteps),
    [palette, config.gradientSteps]
  );

  const paletteSignature = useMemo(
    () => createPaletteSignature(palette),
    [palette]
  );

  const lastSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!config.onPaletteChange) return;
    if (lastSignatureRef.current === paletteSignature) return;
    lastSignatureRef.current = paletteSignature;
    config.onPaletteChange(palette);
  }, [config, palette, paletteSignature]);

  const updatePaletteValue = useCallback(
    (sectionKey: string, channel: PaletteChannelKey, nextValue: number) => {
      const range =
        config.ranges[sectionKey] ??
        DEFAULT_RANGES[sectionKey] ?? {
          min: 0,
          max: 1,
          step: 0.01,
        };
      const clamped = Math.min(Math.max(nextValue, range.min), range.max);
      config.onInteraction?.();
      const controlKey = createPaletteControlKey(
        config.hiddenKeyPrefix,
        sectionKey,
        channel
      );
      setValue(controlKey, clamped);
    },
    [config, setValue]
  );

  const handleResetPalette = useCallback(() => {
    config.onInteraction?.();
    config.sections.forEach((section) => {
      CHANNEL_KEYS.forEach((channel) => {
        const controlKey = createPaletteControlKey(
          config.hiddenKeyPrefix,
          section.key,
          channel
        );
        const defaultValue =
          config.defaultPalette?.[section.key]?.[channel] ??
          DEFAULT_RANGES[section.key]?.min ??
          0;
        setValue(controlKey, defaultValue);
      });
    });
  }, [config, setValue]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-200">
            Palette
          </span>
          <button
            type="button"
            onClick={handleResetPalette}
            className="rounded border border-stone-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-stone-200 transition hover:border-stone-500"
          >
            Reset Palette
          </button>
        </div>
        <div
          className="h-4 w-full rounded border border-stone-700"
          style={{ background: paletteGradient }}
        />
        <div className="flex flex-col gap-4">
          {config.sections.map((section) => {
            const range = config.ranges[section.key];
            return (
              <div key={section.key} className="space-y-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-stone-300">
                  <span>{section.label}</span>
                  {section.helper && (
                    <span className="text-stone-500">{section.helper}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {CHANNEL_KEYS.map((channel) => {
                    const value = palette[section.key][channel];
                    const channelLabel =
                      config.channelLabels?.[channel] ??
                      DEFAULT_CHANNEL_LABELS[channel];
                    return (
                      <div key={channel} className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-stone-400">
                          <span>{channelLabel}</span>
                          <span>{value.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={range.min}
                          max={range.max}
                          step={range.step}
                          value={value}
                          onPointerDown={config.onInteraction}
                          onChange={(event) =>
                            updatePaletteValue(
                              section.key,
                              channel,
                              parseFloat(event.target.value)
                            )
                          }
                          className="w-full cursor-pointer accent-stone-300"
                        />
                        <input
                          type="number"
                          min={range.min}
                          max={range.max}
                          step={range.step}
                          value={value.toFixed(3)}
                          onPointerDown={config.onInteraction}
                          onFocus={config.onInteraction}
                          onChange={(event) => {
                            const parsed = parseFloat(event.target.value);
                            if (Number.isNaN(parsed)) return;
                            updatePaletteValue(section.key, channel, parsed);
                          }}
                          className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1 text-xs text-stone-200 focus:border-stone-500 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdvancedPaletteControl;
