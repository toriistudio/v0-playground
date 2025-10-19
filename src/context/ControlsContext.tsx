"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
  useCallback,
  useRef,
} from "react";

import { getUrlParams } from "@/utils/getUrlParams";
import {
  CHANNEL_KEYS,
  clonePalette,
  createAdvancedPaletteSchemaEntries,
  createPaletteControlKey,
  createPaletteSignature,
  resolveAdvancedPaletteConfig,
  toNumberOr,
  type AdvancedPalette,
  type AdvancedPaletteControlConfig,
  type PaletteChannelKey,
  type ResolvedAdvancedPaletteConfig,
} from "@/lib/advancedPalette";

type BaseControl = {
  hidden?: boolean;
  folder?: string;
  folderPlacement?: "top" | "bottom";
};

export type ControlType =
  | ({ type: "boolean"; value: boolean } & BaseControl)
  | ({
      type: "number";
      value: number;
      min?: number;
      max?: number;
      step?: number;
    } & BaseControl)
  | ({ type: "string"; value: string } & BaseControl)
  | ({ type: "color"; value: string } & BaseControl)
  | ({
      type: "select";
      value: string;
      options: Record<string, any>;
    } & BaseControl)
  | ({
      type: "button";
      onClick?: () => void;
      label?: string;
      render?: () => React.ReactNode;
    } & BaseControl);

export type ControlsSchema = Record<string, ControlType>;

type CopyButtonFnArgs = {
  componentName?: string;
  values: Record<string, any>;
  schema: ControlsSchema;
  jsx: string;
  jsonToComponentString: (options: {
    componentName?: string;
    props: Record<string, unknown>;
  }) => string;
};

type ControlsConfig = {
  showCopyButton?: boolean;
  showCopyButtonFn?: (args: CopyButtonFnArgs) => string | null | undefined;
  mainLabel?: string;
  showGrid?: boolean;
  addAdvancedPaletteControl?: ResolvedAdvancedPaletteConfig;
};

type UseControlsConfig = Omit<ControlsConfig, "addAdvancedPaletteControl"> & {
  addAdvancedPaletteControl?: AdvancedPaletteControlConfig;
};

type UseControlsOptions = {
  componentName?: string;
  config?: UseControlsConfig;
};

type ControlsContextValue = {
  schema: ControlsSchema;
  values: Record<string, any>;
  setValue: (key: string, value: any) => void;
  registerSchema: (
    newSchema: ControlsSchema,
    opts?: {
      componentName?: string;
      config?: UseControlsConfig;
    }
  ) => void;
  componentName?: string;
  config?: ControlsConfig;
};

const ControlsContext = createContext<ControlsContextValue | null>(null);

export const useControlsContext = () => {
  const ctx = useContext(ControlsContext);
  if (!ctx) throw new Error("useControls must be used within ControlsProvider");
  return ctx;
};

export const ControlsProvider = ({ children }: { children: ReactNode }) => {
  const [schema, setSchema] = useState<ControlsSchema>({});
  const [values, setValues] = useState<Record<string, any>>({});
  const [config, setConfig] = useState<ControlsConfig>({
    showCopyButton: true,
  });
  const [componentName, setComponentName] = useState<string | undefined>();

  const setValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const registerSchema = (
    newSchema: ControlsSchema,
    opts?: { componentName?: string; config?: UseControlsConfig }
  ) => {
    if (opts?.componentName) {
      setComponentName(opts.componentName);
    }

    if (opts?.config) {
      const { addAdvancedPaletteControl, ...otherConfig } = opts.config;

      setConfig((prev) => ({
        ...prev,
        ...otherConfig,
        ...(Object.prototype.hasOwnProperty.call(
          opts.config,
          "addAdvancedPaletteControl"
        )
          ? {
              addAdvancedPaletteControl: addAdvancedPaletteControl
                ? resolveAdvancedPaletteConfig(addAdvancedPaletteControl)
                : undefined,
            }
          : {}),
      }));
    }

    setSchema((prevSchema) => ({ ...prevSchema, ...newSchema }));
    setValues((prevValues) => {
      const updated = { ...prevValues };

      for (const key in newSchema) {
        const control = newSchema[key];
        if (!(key in updated)) {
          if ("value" in control) {
            updated[key] = control.value;
          }
        }
      }

      return updated;
    });
  };

  const contextValue = useMemo(
    () => ({
      schema,
      values,
      setValue,
      registerSchema,
      componentName,
      config,
    }),
    [schema, values, componentName, config]
  );

  return (
    <ControlsContext.Provider value={contextValue}>
      {children}
    </ControlsContext.Provider>
  );
};

export const useControls = <T extends ControlsSchema>(
  schema: T,
  options?: UseControlsOptions
) => {
  const ctx = useContext(ControlsContext);
  if (!ctx) throw new Error("useControls must be used within ControlsProvider");
  const lastAdvancedPaletteSignature = useRef<string | null>(null);

  // Merge URL params with schema defaults
  const urlParams = getUrlParams();

  const resolvedAdvancedConfig = options?.config?.addAdvancedPaletteControl
    ? resolveAdvancedPaletteConfig(options.config.addAdvancedPaletteControl)
    : undefined;

  const schemaWithAdvanced = useMemo(() => {
    const baseSchema: ControlsSchema = { ...schema };
    if (!resolvedAdvancedConfig) return baseSchema;
    return createAdvancedPaletteSchemaEntries(
      baseSchema,
      resolvedAdvancedConfig
    );
  }, [schema, resolvedAdvancedConfig]);

  const urlParamsKey = useMemo(() => JSON.stringify(urlParams), [urlParams]);

  const mergedSchema = useMemo(() => {
    return Object.fromEntries(
      Object.entries(schemaWithAdvanced).map(([key, control]) => {
        const urlValue = urlParams[key];
        if (!urlValue || !("value" in control)) return [key, control];

        const defaultValue = control.value;

        let parsed: any = urlValue;
        if (typeof defaultValue === "number") {
          parsed = parseFloat(urlValue);
          if (isNaN(parsed)) parsed = defaultValue;
        } else if (typeof defaultValue === "boolean") {
          parsed = urlValue === "true";
        }

        return [
          key,
          {
            ...control,
            value: parsed,
          },
        ];
      })
    ) as ControlsSchema;
  }, [schemaWithAdvanced, urlParams, urlParamsKey]);

  // Register the merged schema
  useEffect(() => {
    ctx.registerSchema(mergedSchema, options);
  }, [JSON.stringify(mergedSchema), JSON.stringify(options)]);

  // Set default values
  useEffect(() => {
    for (const key in mergedSchema) {
      if (!(key in ctx.values) && "value" in mergedSchema[key]) {
        ctx.setValue(key, mergedSchema[key].value);
      }
    }
  }, [JSON.stringify(mergedSchema), JSON.stringify(ctx.values)]);

  useEffect(() => {
    if (!resolvedAdvancedConfig?.onPaletteChange) return;

    const palette = resolvedAdvancedConfig.sections.reduce<AdvancedPalette>(
      (acc, section) => {
        const channels = CHANNEL_KEYS.reduce<Record<PaletteChannelKey, number>>(
          (channelAcc, channel) => {
            const key = createPaletteControlKey(
              resolvedAdvancedConfig.hiddenKeyPrefix,
              section.key,
              channel
            );
            const fallback =
              resolvedAdvancedConfig.defaultPalette?.[section.key]?.[channel] ??
              0;
            channelAcc[channel] = toNumberOr(ctx.values[key], fallback);
            return channelAcc;
          },
          {} as Record<PaletteChannelKey, number>
        );

        acc[section.key] = channels;
        return acc;
      },
      {} as AdvancedPalette
    );

    const signature = createPaletteSignature(palette);
    if (lastAdvancedPaletteSignature.current === signature) return;

    lastAdvancedPaletteSignature.current = signature;
    resolvedAdvancedConfig.onPaletteChange(clonePalette(palette));
  }, [ctx.values, resolvedAdvancedConfig]);

  // Strongly-typed return values
  const typedValues = ctx.values as {
    [K in keyof T]: T[K] extends { value: infer V } ? V : never;
  };

  const jsx = useCallback(() => {
    if (!options?.componentName) return "";
    const props = Object.entries(typedValues)
      .map(([key, val]) => {
        if (typeof val === "string") return `${key}="${val}"`;
        if (typeof val === "boolean") return `${key}={${val}}`;
        return `${key}={${JSON.stringify(val)}}`;
      })
      .join(" ");
    return `<${options.componentName} ${props} />`;
  }, [options?.componentName, JSON.stringify(typedValues)]);

  return {
    ...typedValues,
    controls: ctx.values,
    schema: ctx.schema,
    setValue: ctx.setValue,
    jsx,
  };
};

export const useUrlSyncedControls = useControls;
