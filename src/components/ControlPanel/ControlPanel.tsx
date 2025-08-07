"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, SquareArrowOutUpRight } from "lucide-react";

import { usePreviewUrl } from "@/hooks/usePreviewUrl";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import { useResizableLayout } from "@/context/ResizableLayout";
import { useControlsContext } from "@/context/ControlsContext";

import { Button } from "@/components/ui/button";

const ControlPanel: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const { leftPanelWidth, isDesktop, isHydrated } = useResizableLayout();

  const { schema, setValue, values, componentName, config } =
    useControlsContext();

  const previewUrl = usePreviewUrl(values);

  const normalControls = Object.entries(schema).filter(
    ([, control]) => control.type !== "button" && !control.hidden
  );
  const buttonControls = Object.entries(schema).filter(
    ([, control]) => control.type === "button" && !control.hidden
  );

  const jsx = useMemo(() => {
    if (!componentName) return "";
    const props = Object.entries(values)
      .map(([key, val]) => {
        if (typeof val === "string") return `${key}="${val}"`;
        if (typeof val === "boolean") return `${key}={${val}}`;
        return `${key}={${JSON.stringify(val)}}`;
      })
      .join(" ");
    return `<${componentName} ${props} />`;
  }, [componentName, values]);

  return (
    <div
      className={`order-2 md:order-1 w-full md:h-auto p-2 md:p-4 bg-stone-900 font-mono text-stone-300 transition-opacity duration-300 ${
        !isHydrated ? "opacity-0" : "opacity-100"
      }`}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        height: "auto",
        flex: "0 0 auto",
        ...(isHydrated && isDesktop
          ? {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${leftPanelWidth}%`,
              overflowY: "auto",
            }
          : {}),
      }}
    >
      <div className="mb-10 space-y-4 p-2 md:p-4 border border-stone-700 rounded-md">
        <div className="space-y-1">
          <h1 className="text-lg text-stone-100 font-bold">
            {config?.mainLabel ?? "Controls"}
          </h1>
        </div>

        <div className="space-y-4 pt-2">
          {normalControls.map(([key, control]) => {
            const value = values[key];

            switch (control.type) {
              case "boolean":
                return (
                  <div
                    key={key}
                    className="flex items-center space-x-4 border-t border-stone-700 pt-4"
                  >
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={(v) => setValue(key, v)}
                      className="data-[state=checked]:bg-stone-700 data-[state=unchecked]:bg-stone-700/40"
                    />
                    <Label htmlFor={key} className="cursor-pointer">
                      {key}
                    </Label>
                  </div>
                );

              case "number":
                return (
                  <div key={key} className="space-y-2 w-full">
                    <div className="flex items-center justify-between pb-1">
                      <Label className="text-stone-300" htmlFor={key}>
                        {key}: {value}
                      </Label>
                    </div>
                    <Slider
                      id={key}
                      min={control.min ?? 0}
                      max={control.max ?? 100}
                      step={control.step ?? 1}
                      value={[value]}
                      onValueChange={([v]) => setValue(key, v)}
                      className="[&>span]:border-none [&_.bg-primary]:bg-stone-800 [&>.bg-background]:bg-stone-500/30"
                    />
                  </div>
                );

              case "string":
                return (
                  <Input
                    key={key}
                    id={key}
                    value={value}
                    className={"bg-stone-900"}
                    placeholder={key}
                    onChange={(e) => setValue(key, e.target.value)}
                  />
                );

              case "color":
                return (
                  <div key={key} className="space-y-2 w-full">
                    <div className="flex items-center justify-between pb-1">
                      <Label className="text-stone-300" htmlFor={key}>
                        {key}
                      </Label>
                    </div>
                    <input
                      type="color"
                      id={key}
                      value={value}
                      onChange={(e) => setValue(key, e.target.value)}
                      className="w-full h-10 rounded border border-stone-600 bg-transparent"
                    />
                  </div>
                );

              case "select":
                return (
                  <div
                    key={key}
                    className="space-y-2 border-t border-stone-700 pt-4"
                  >
                    <Label className="text-stone-300" htmlFor={key}>
                      {key}
                    </Label>
                    <Select
                      value={value}
                      onValueChange={(val) => setValue(key, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(control.options).map(
                          ([label, _val]) => (
                            <SelectItem key={label} value={label}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                );

              default:
                return null;
            }
          })}
          {(buttonControls.length > 0 || jsx) && (
            <div
              className={`${
                normalControls.length > 0 ? "border-t" : ""
              } border-stone-700`}
            >
              {jsx && config?.showCopyButton !== false && (
                <div key="control-panel-jsx" className="flex-1 pt-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(jsx);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 5000);
                    }}
                    className="w-full px-4 py-2 text-sm bg-stone-700 hover:bg-stone-600 text-white rounded flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
              )}
              {buttonControls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {buttonControls.map(([key, control]) =>
                    control.type === "button" ? (
                      <div
                        key={`control-panel-custom-${key}`}
                        className="flex-1"
                      >
                        {control.render ? (
                          control.render()
                        ) : (
                          <button
                            onClick={control.onClick}
                            className="w-full px-4 py-2 text-sm bg-stone-700 hover:bg-stone-600 text-white rounded"
                          >
                            {control.label ?? key}
                          </button>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {previewUrl && (
          <Button asChild>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 text-sm text-center bg-stone-800 hover:bg-stone-700 text-white rounded"
            >
              <SquareArrowOutUpRight /> Open in a New Tab
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
