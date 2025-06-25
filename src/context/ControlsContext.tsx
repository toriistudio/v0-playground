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

import { getUrlParams, parseValue } from "@/utils/getUrlParams";

export type ControlType =
  | { type: "boolean"; value: boolean }
  | { type: "number"; value: number; min?: number; max?: number; step?: number }
  | { type: "string"; value: string }
  | { type: "color"; value: string }
  | { type: "select"; value: string; options: string[] }
  | {
      type: "button";
      onClick?: () => void;
      label?: string;
      render?: () => React.ReactNode; // 👈 NEW
    };

export type ControlsSchema = Record<string, ControlType>;

type ControlsContextValue = {
  schema: ControlsSchema;
  values: Record<string, any>;
  setValue: (key: string, value: any) => void;
  registerSchema: (
    newSchema: ControlsSchema,
    opts?: { componentName?: string }
  ) => void;
  componentName?: string;
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
  const [componentName, setComponentName] = useState<string | undefined>();

  const setValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const registerSchema = (
    newSchema: ControlsSchema,
    opts?: { componentName?: string }
  ) => {
    if (opts?.componentName) {
      setComponentName(opts.componentName);
    }

    setSchema((prevSchema) => ({ ...prevSchema, ...newSchema }));
    setValues((prevValues) => {
      const updated = { ...prevValues };
      for (const key in newSchema) {
        if (!(key in updated)) {
          const control = newSchema[key];

          if ("value" in control) {
            updated[key] = control.value;
          }
        }
      }
      return updated;
    });
  };

  const contextValue = useMemo(
    () => ({ schema, values, setValue, registerSchema, componentName }),
    [schema, values, componentName]
  );

  return (
    <ControlsContext.Provider value={contextValue}>
      {children}
    </ControlsContext.Provider>
  );
};

export const useControls = <T extends ControlsSchema>(
  schema: T,
  options?: { componentName?: string }
) => {
  const ctx = useContext(ControlsContext);
  if (!ctx) throw new Error("useControls must be used within ControlsProvider");

  useEffect(() => {
    ctx.registerSchema(schema, options);
  }, [JSON.stringify(schema), JSON.stringify(options)]);

  useEffect(() => {
    for (const key in schema) {
      if (!(key in ctx.values) && "value" in schema[key]) {
        ctx.setValue(key, schema[key].value);
      }
    }
  }, [JSON.stringify(schema), JSON.stringify(ctx.values)]);

  // Map controls to strongly typed values
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

export const useUrlSyncedControls = <T extends ControlsSchema>(
  schema: T,
  options?: { componentName?: string }
) => {
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

  return useControls(mergedSchema, options);
};
