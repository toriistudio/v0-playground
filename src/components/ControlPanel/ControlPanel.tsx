"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Check, Copy, SquareArrowOutUpRight, ChevronDown } from "lucide-react";

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
import { MOBILE_CONTROL_PANEL_PEEK } from "@/constants/layout";
import AdvancedPaletteControl from "@/components/AdvancedPaletteControl";

const ControlPanel: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [folderStates, setFolderStates] = useState<Record<string, boolean>>({});

  const { leftPanelWidth, isDesktop, isHydrated } = useResizableLayout();

  const { schema, setValue, values, componentName, config } =
    useControlsContext();

  const previewUrl = usePreviewUrl(values);

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

  type ControlEntry = [string, (typeof schema)[string]];

  const visibleEntries = Object.entries(schema).filter(
    ([, control]) => !control.hidden
  ) as ControlEntry[];

  const rootControls: ControlEntry[] = [];
  const folderOrder: string[] = [];
  const folderControls = new Map<string, ControlEntry[]>();
  const folderExtras = new Map<string, React.ReactNode[]>();
  const folderPlacement = new Map<string, "top" | "bottom">();
  const seenFolders = new Set<string>();

  const ensureFolder = (folder: string) => {
    if (!seenFolders.has(folder)) {
      seenFolders.add(folder);
      folderOrder.push(folder);
    }
  };

  visibleEntries.forEach((entry) => {
    const [key, control] = entry;
    const folder = control.folder?.trim();

    if (folder) {
      const placement = control.folderPlacement ?? "bottom";
      ensureFolder(folder);
      if (!folderControls.has(folder)) {
        folderControls.set(folder, []);
      }
      folderControls.get(folder)!.push(entry);
      const existingPlacement = folderPlacement.get(folder);
      if (!existingPlacement || placement === "top") {
        folderPlacement.set(folder, placement);
      }
    } else {
      rootControls.push(entry);
    }
  });

  const advancedConfig = config?.addAdvancedPaletteControl;
  let advancedPaletteControlNode: React.ReactNode = null;

  if (advancedConfig) {
    const advancedNode = (
      <AdvancedPaletteControl
        key="advancedPaletteControl"
        config={advancedConfig}
      />
    );
    const advancedFolder = advancedConfig.folder?.trim();
    if (advancedFolder) {
      const placement = advancedConfig.folderPlacement ?? "bottom";
      ensureFolder(advancedFolder);
      if (!folderControls.has(advancedFolder)) {
        folderControls.set(advancedFolder, []);
      }
      const existingPlacement = folderPlacement.get(advancedFolder);
      if (!existingPlacement || placement === "top") {
        folderPlacement.set(advancedFolder, placement);
      }
      if (!folderExtras.has(advancedFolder)) {
        folderExtras.set(advancedFolder, []);
      }
      folderExtras.get(advancedFolder)!.push(advancedNode);
    } else {
      advancedPaletteControlNode = advancedNode;
    }
  }

  const rootButtonControls = rootControls.filter(
    ([, control]) => control.type === "button"
  );
  const rootNormalControls = rootControls.filter(
    ([, control]) => control.type !== "button"
  );

  const folderGroups = folderOrder
    .map((folder) => ({
      folder,
      entries: folderControls.get(folder) ?? [],
      extras: folderExtras.get(folder) ?? [],
      placement: folderPlacement.get(folder) ?? "bottom",
    }))
    .filter((group) => group.entries.length > 0 || group.extras.length > 0);

  const hasRootButtonControls = rootButtonControls.length > 0;
  const hasAnyFolders = folderGroups.length > 0;
  const jsonToComponentString = useCallback(
    ({
      componentName: componentNameOverride,
      props,
    }: {
      componentName?: string;
      props: Record<string, unknown>;
    }) => {
      const resolvedComponentName = componentNameOverride ?? componentName;
      if (!resolvedComponentName) return "";

      const formatProp = (key: string, value: unknown): string | null => {
        if (value === undefined) return null;
        if (value === null) return `${key}={null}`;
        if (typeof value === "string") return `${key}="${value}"`;
        if (typeof value === "number" || typeof value === "boolean") {
          return `${key}={${value}}`;
        }
        if (typeof value === "bigint") {
          return `${key}={${value.toString()}n}`;
        }
        return `${key}={${JSON.stringify(value)}}`;
      };

      const formattedProps = Object.entries(props ?? {})
        .map(([key, value]) => formatProp(key, value))
        .filter((prop): prop is string => Boolean(prop))
        .join(" ");

      if (!formattedProps) {
        return `<${resolvedComponentName} />`;
      }

      return `<${resolvedComponentName} ${formattedProps} />`;
    },
    [componentName]
  );
  const copyText =
    config?.showCopyButtonFn?.({
      componentName,
      values,
      schema,
      jsx,
      jsonToComponentString,
    }) ?? jsx;
  const shouldShowCopyButton =
    config?.showCopyButton !== false && Boolean(copyText);

  // Format raw schema keys into human-friendly labels
  const labelize = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/[\-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/(^|\s)\S/g, (s) => s.toUpperCase());

  const renderButtonControl = (
    key: string,
    control: Extract<(typeof schema)[string], { type: "button" }>,
    variant: "root" | "folder"
  ) => (
    <div
      key={`control-panel-custom-${key}`}
      className={
        variant === "root"
          ? "flex-1 [&_[data-slot=button]]:w-full"
          : "[&_[data-slot=button]]:w-full"
      }
    >
      {control.render ? (
        control.render()
      ) : (
        <button
          onClick={control.onClick}
          className="w-full px-4 py-2 text-sm bg-stone-800 hover:bg-stone-700 text-white rounded-md shadow"
        >
          {control.label ?? key}
        </button>
      )}
    </div>
  );

  const renderControl = (
    key: string,
    control: (typeof schema)[string],
    variant: "root" | "folder"
  ) => {
    if (control.type === "button") {
      return renderButtonControl(key, control, variant);
    }

    const value = values[key];

    switch (control.type) {
      case "boolean":
        return (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key} className="cursor-pointer">
              {labelize(key)}
            </Label>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(v) => setValue(key, v)}
              className="cursor-pointer scale-90"
            />
          </div>
        );

      case "number":
        return (
          <div key={key} className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <Label className="text-stone-300" htmlFor={key}>
                {labelize(key)}
              </Label>
              <Input
                type="number"
                value={value}
                min={control.min ?? 0}
                max={control.max ?? 100}
                step={control.step ?? 1}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (Number.isNaN(v)) return;
                  setValue(key, v);
                }}
                className="w-20 text-center cursor-text"
              />
            </div>
            <Slider
              id={key}
              min={control.min ?? 0}
              max={control.max ?? 100}
              step={control.step ?? 1}
              value={[value]}
              onValueChange={([v]) => setValue(key, v)}
              className="w-full cursor-pointer"
            />
          </div>
        );

      case "string":
        return (
          <div key={key} className="space-y-2 w-full">
            <Label className="text-stone-300" htmlFor={key}>
              {labelize(key)}
            </Label>
            <Input
              id={key}
              value={value}
              placeholder={key}
              onChange={(e) => setValue(key, e.target.value)}
              className="bg-stone-900"
            />
          </div>
        );

      case "color":
        return (
          <div key={key} className="space-y-2 w-full">
            <Label className="text-stone-300" htmlFor={key}>
              {labelize(key)}
            </Label>
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
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className="min-w-fit" htmlFor={key}>
                {labelize(key)}
              </Label>
              <Select value={value} onValueChange={(val) => setValue(key, val)}>
                <SelectTrigger className="flex-1 cursor-pointer">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent className="cursor-pointer z-[9999]">
                  {Object.entries(control.options).map(([label]) => (
                    <SelectItem
                      key={label}
                      value={label}
                      className="cursor-pointer"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFolder = (
    folder: string,
    entries: ControlEntry[],
    extras: React.ReactNode[] = []
  ) => {
    const isOpen = folderStates[folder] ?? true;

    return (
      <div
        key={folder}
        className="border border-stone-700/60 rounded-lg bg-stone-900/70"
      >
        <button
          type="button"
          onClick={() =>
            setFolderStates((prev) => ({
              ...prev,
              [folder]: !isOpen,
            }))
          }
          className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-stone-200 tracking-wide"
        >
          <span>{folder}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {isOpen && (
          <div className="px-4 pb-4 pt-0 space-y-5">
            {entries.map(([key, control]) =>
              renderControl(key, control, "folder")
            )}
            {extras.map((extra) => extra)}
          </div>
        )}
      </div>
    );
  };

  const topFolderSections = hasAnyFolders
    ? folderGroups
        .filter(({ placement }) => placement === "top")
        .map(({ folder, entries, extras }) =>
          renderFolder(folder, entries, extras)
        )
    : null;

  const bottomFolderSections = hasAnyFolders
    ? folderGroups
        .filter(({ placement }) => placement === "bottom")
        .map(({ folder, entries, extras }) =>
          renderFolder(folder, entries, extras)
        )
    : null;

  const panelStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    flex: "0 0 auto",
  };

  if (isHydrated) {
    if (isDesktop) {
      Object.assign(panelStyle, {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: `${leftPanelWidth}%`,
        overflowY: "auto",
      });
    } else {
      Object.assign(panelStyle, {
        marginTop: `calc(-1 * (${MOBILE_CONTROL_PANEL_PEEK}px + env(safe-area-inset-bottom, 0px)))`,
        paddingBottom: `calc(${MOBILE_CONTROL_PANEL_PEEK}px + env(safe-area-inset-bottom, 0px))`,
      });
    }
  }

  return (
    <div
      className={`order-2 md:order-1 w-full md:h-auto p-2 md:p-4 bg-stone-900 font-mono text-stone-300 transition-opacity duration-300 z-max ${
        !isHydrated ? "opacity-0" : "opacity-100"
      }`}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={panelStyle}
    >
      <div className="dark mb-10 space-y-6 p-4 md:p-6 bg-stone-900/95 backdrop-blur-md border-2 border-stone-700 rounded-xl shadow-lg">
        <div className="space-y-1">
          <h1 className="text-lg text-stone-100 font-semibold">
            {config?.mainLabel ?? "Controls"}
          </h1>
        </div>

        <div className="space-y-6">
          {topFolderSections}
          {hasRootButtonControls && (
            <div className="flex flex-wrap gap-2">
              {rootButtonControls.map(([key, control]) =>
                renderButtonControl(key, control, "root")
              )}
            </div>
          )}
          {advancedPaletteControlNode}
          {rootNormalControls.map(([key, control]) =>
            renderControl(key, control, "root")
          )}
          {bottomFolderSections}
          {shouldShowCopyButton && (
            <div key="control-panel-jsx" className="flex-1 pt-4">
              <button
                onClick={() => {
                  if (!copyText) return;
                  navigator.clipboard.writeText(copyText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 5000);
                }}
                className="w-full px-4 py-2 text-sm bg-stone-800 hover:bg-stone-700 text-white rounded-md flex items-center justify-center gap-2 shadow"
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
        </div>
        {previewUrl && (
          <Button asChild>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-2 text-sm text-center bg-stone-900 hover:bg-stone-800 text-white rounded-md border border-stone-700"
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
