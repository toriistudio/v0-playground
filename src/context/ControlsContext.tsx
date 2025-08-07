"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";

import { getUrlParams } from "@/utils/getUrlParams";

type BaseControl = {
  hidden?: boolean;
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

type ControlsConfig = {
  showCopyButton?: boolean;
  mainLabel?: string;
  showGrid?: boolean;
};

type ControlsContextValue = {
  schema: ControlsSchema;
  values: Record<string, any>;
  setValue: (key: string, value: any) => void;
  registerSchema: (
    newSchema: ControlsSchema,
    opts?: {
      componentName?: string;
      config?: ControlsConfig;
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
    opts?: { componentName?: string; config?: ControlsConfig }
  ) => {
    if (opts?.componentName) {
      setComponentName(opts.componentName);
    }

    if (opts?.config) {
      setConfig((prev) => ({
        ...prev,
        ...opts.config,
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
  options?: {
    componentName?: string;
    config?: ControlsConfig;
  }
) => {
  const ctx = useContext(ControlsContext);
  if (!ctx) throw new Error("useControls must be used within ControlsProvider");

  // Merge URL params with schema defaults
  const urlParams = getUrlParams();

  const mergedSchema = Object.fromEntries(
    Object.entries(schema).map(([key, control]) => {
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
  ) as T;

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
