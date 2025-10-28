"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Check,
  Copy,
  SquareArrowOutUpRight,
  ChevronDown,
  Presentation,
} from "lucide-react";

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
import {
  CONTROLS_ONLY_PARAM,
  NO_CONTROLS_PARAM,
  PRESENTATION_PARAM,
} from "@/constants/urlParams";
import AdvancedPaletteControl from "@/components/AdvancedPaletteControl";

const splitPropsString = (input: string) => {
  const props: string[] = [];
  let current = "";
  let curlyDepth = 0;
  let squareDepth = 0;
  let parenDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let escapeNext = false;

  for (const char of input) {
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escapeNext = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === "`" && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === "{") {
        curlyDepth += 1;
      } else if (char === "}") {
        curlyDepth = Math.max(0, curlyDepth - 1);
      } else if (char === "[") {
        squareDepth += 1;
      } else if (char === "]") {
        squareDepth = Math.max(0, squareDepth - 1);
      } else if (char === "(") {
        parenDepth += 1;
      } else if (char === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
      }
    }

    const atTopLevel =
      !inSingleQuote &&
      !inDoubleQuote &&
      !inBacktick &&
      curlyDepth === 0 &&
      squareDepth === 0 &&
      parenDepth === 0;

    if (atTopLevel && /\s/.test(char)) {
      if (current.trim()) {
        props.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    props.push(current.trim());
  }

  return props;
};

const formatJsxCodeSnippet = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.includes("\n")) {
    return trimmed;
  }
  if (!trimmed.startsWith("<") || !trimmed.endsWith(">")) {
    return trimmed;
  }
  if (!trimmed.endsWith("/>")) {
    return trimmed;
  }

  const inner = trimmed.slice(1, -2).trim();
  const firstSpaceIndex = inner.indexOf(" ");

  if (firstSpaceIndex === -1) {
    return `<${inner} />`;
  }

  const componentName = inner.slice(0, firstSpaceIndex);
  const propsString = inner.slice(firstSpaceIndex + 1).trim();

  if (!propsString) {
    return `<${componentName} />`;
  }

  const propsList = splitPropsString(propsString);
  if (propsList.length === 0) {
    return `<${componentName} ${propsString} />`;
  }

  const formattedProps = propsList.map((prop) => `  ${prop}`).join("\n");
  return `<${componentName}\n${formattedProps}\n/>`;
};

type HighlightToken =
  | { type: "plain"; value: string }
  | {
      type: "tag" | "attrName" | "string" | "expression" | "punctuation";
      value: string;
    };

const isWhitespace = (char: string) => /\s/.test(char);
const isAttrNameChar = (char: string) => /[A-Za-z0-9_$\-.:]/.test(char);
const isAlphaStart = (char: string) => /[A-Za-z_$]/.test(char);

const tokenizeJsx = (input: string): HighlightToken[] => {
  const tokens: HighlightToken[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === "<") {
      tokens.push({ type: "punctuation", value: "<" });
      i += 1;

      if (input[i] === "/") {
        tokens.push({ type: "punctuation", value: "/" });
        i += 1;
      }

      const start = i;
      while (i < input.length && isAttrNameChar(input[i])) {
        i += 1;
      }
      if (i > start) {
        tokens.push({ type: "tag", value: input.slice(start, i) });
      }
      continue;
    }

    if (char === "/" && input[i + 1] === ">") {
      tokens.push({ type: "punctuation", value: "/>" });
      i += 2;
      continue;
    }

    if (char === ">") {
      tokens.push({ type: "punctuation", value: ">" });
      i += 1;
      continue;
    }

    if (char === "=") {
      tokens.push({ type: "punctuation", value: "=" });
      i += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let j = i + 1;
      let value = quote;
      while (j < input.length) {
        const current = input[j];
        value += current;
        if (current === quote && input[j - 1] !== "\\") {
          break;
        }
        j += 1;
      }
      tokens.push({ type: "string", value });
      i = j + 1;
      continue;
    }

    if (char === "{") {
      let depth = 1;
      let j = i + 1;
      while (j < input.length && depth > 0) {
        if (input[j] === "{") {
          depth += 1;
        } else if (input[j] === "}") {
          depth -= 1;
        }
        j += 1;
      }
      const expression = input.slice(i, j);
      tokens.push({ type: "expression", value: expression });
      i = j;
      continue;
    }

    if (isAlphaStart(char)) {
      const start = i;
      i += 1;
      while (i < input.length && isAttrNameChar(input[i])) {
        i += 1;
      }
      const word = input.slice(start, i);
      let k = i;
      while (k < input.length && isWhitespace(input[k])) {
        k += 1;
      }
      if (input[k] === "=") {
        tokens.push({ type: "attrName", value: word });
      } else {
        tokens.push({ type: "plain", value: word });
      }
      continue;
    }

    tokens.push({ type: "plain", value: char });
    i += 1;
  }

  return tokens;
};

const TOKEN_CLASS_MAP: Record<
  Exclude<HighlightToken["type"], "plain">,
  string
> = {
  tag: "text-sky-300",
  attrName: "text-amber-200",
  string: "text-emerald-300",
  expression: "text-purple-300",
  punctuation: "text-stone-400",
};

const highlightJsx = (input: string): React.ReactNode[] => {
  const tokens = tokenizeJsx(input);
  const nodes: React.ReactNode[] = [];

  tokens.forEach((token, index) => {
    if (token.type === "plain") {
      nodes.push(token.value);
    } else {
      nodes.push(
        <span key={`token-${index}`} className={TOKEN_CLASS_MAP[token.type]}>
          {token.value}
        </span>
      );
    }
  });

  return nodes;
};

const ControlPanel: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [folderStates, setFolderStates] = useState<Record<string, boolean>>({});
  const codeCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { leftPanelWidth, isDesktop, isHydrated } = useResizableLayout();

  const { schema, setValue, values, componentName, config } =
    useControlsContext();

  const isControlsOnlyView =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get(CONTROLS_ONLY_PARAM) ===
      "true";

  const previewUrl = usePreviewUrl(values);

  const buildUrl = useCallback(
    (modifier: (params: URLSearchParams) => void) => {
      if (!previewUrl) return "";
      const [path, search = ""] = previewUrl.split("?");
      const params = new URLSearchParams(search);
      modifier(params);
      const query = params.toString();
      return query ? `${path}?${query}` : path;
    },
    [previewUrl]
  );

  const presentationUrl = useMemo(() => {
    if (!previewUrl) return "";
    return buildUrl((params) => {
      params.set(PRESENTATION_PARAM, "true");
    });
  }, [buildUrl, previewUrl]);

  const controlsOnlyUrl = useMemo(() => {
    if (!previewUrl) return "";
    return buildUrl((params) => {
      params.delete(NO_CONTROLS_PARAM);
      params.delete(PRESENTATION_PARAM);
      params.set(CONTROLS_ONLY_PARAM, "true");
    });
  }, [buildUrl, previewUrl]);

  const handlePresentationClick = useCallback(() => {
    if (typeof window === "undefined" || !presentationUrl) return;

    window.open(presentationUrl, "_blank", "noopener,noreferrer");

    if (controlsOnlyUrl) {
      const viewportWidth = window.innerWidth || 1200;
      const viewportHeight = window.innerHeight || 900;
      const controlsWidth = Math.max(
        320,
        Math.min(
          600,
          Math.round((viewportWidth * leftPanelWidth) / 100)
        )
      );
      const controlsHeight = Math.max(600, viewportHeight);
      const controlsFeatures = [
        "noopener",
        "noreferrer",
        "toolbar=0",
        "menubar=0",
        "resizable=yes",
        "scrollbars=yes",
        `width=${controlsWidth}`,
        `height=${controlsHeight}`,
      ].join(",");

      window.open(controlsOnlyUrl, "v0-controls", controlsFeatures);
    }
  }, [controlsOnlyUrl, leftPanelWidth, presentationUrl]);

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
  const baseSnippet = copyText || jsx;
  const formattedCode = useMemo(
    () => formatJsxCodeSnippet(baseSnippet),
    [baseSnippet]
  );
  const hasCodeSnippet = Boolean(config?.showCodeSnippet && formattedCode);
  const highlightedCode = useMemo<React.ReactNode[] | null>(
    () => (formattedCode ? highlightJsx(formattedCode) : null),
    [formattedCode]
  );

  useEffect(() => {
    if (!hasCodeSnippet) {
      setIsCodeVisible(false);
    }
  }, [hasCodeSnippet]);

  useEffect(() => {
    setCodeCopied(false);
    if (codeCopyTimeoutRef.current) {
      clearTimeout(codeCopyTimeoutRef.current);
      codeCopyTimeoutRef.current = null;
    }
  }, [formattedCode]);

  useEffect(() => {
    return () => {
      if (codeCopyTimeoutRef.current) {
        clearTimeout(codeCopyTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleCodeVisibility = useCallback(() => {
    setIsCodeVisible((prev) => {
      const next = !prev;
      if (!next) {
        setCodeCopied(false);
        if (codeCopyTimeoutRef.current) {
          clearTimeout(codeCopyTimeoutRef.current);
          codeCopyTimeoutRef.current = null;
        }
      }
      return next;
    });
  }, []);

  const handleCodeCopy = useCallback(() => {
    if (!formattedCode) return;
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      return;
    }
    navigator.clipboard
      .writeText(formattedCode)
      .then(() => {
        setCodeCopied(true);
        if (codeCopyTimeoutRef.current) {
          clearTimeout(codeCopyTimeoutRef.current);
        }
        codeCopyTimeoutRef.current = setTimeout(() => {
          setCodeCopied(false);
          codeCopyTimeoutRef.current = null;
        }, 3000);
      })
      .catch(() => {
        // noop
      });
  }, [formattedCode]);

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

  if (isHydrated && !isControlsOnlyView) {
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
          {hasCodeSnippet && (
            <div className="border border-stone-700/60 rounded-lg bg-stone-900/70">
              <button
                type="button"
                onClick={handleToggleCodeVisibility}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-stone-200 tracking-wide"
                aria-expanded={isCodeVisible}
              >
                <span>{isCodeVisible ? "Hide Code" : "Show Code"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isCodeVisible ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isCodeVisible && (
                <div className="relative border-t border-stone-700/60 bg-stone-950/60 px-4 py-4 rounded-b-lg">
                  <button
                    type="button"
                    onClick={handleCodeCopy}
                    className="absolute top-3 right-3 flex items-center gap-1 rounded-md border border-stone-700 bg-stone-800 px-2 py-1 text-xs font-medium text-white shadow hover:bg-stone-700"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <pre className="whitespace-pre overflow-x-auto text-xs md:text-sm text-stone-200 pr-14">
                    <code className="block text-stone-200">
                      {highlightedCode ?? formattedCode}
                    </code>
                  </pre>
                </div>
              )}
            </div>
          )}
          {shouldShowCopyButton && (
            <div key="control-panel-jsx" className="flex-1 pt-4">
              <button
                onClick={() => {
                  const copyPayload = formattedCode || baseSnippet;
                  if (!copyPayload) return;
                  navigator.clipboard.writeText(copyPayload);
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
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-2 text-sm text-center bg-stone-900 hover:bg-stone-800 text-white rounded-md border border-stone-700"
              >
                <SquareArrowOutUpRight /> Open in a New Tab
              </a>
            </Button>
            {config?.showPresentationButton && presentationUrl && (
              <Button
                type="button"
                onClick={handlePresentationClick}
                variant="secondary"
                className="w-full bg-stone-800 text-white hover:bg-stone-700 border border-stone-700"
              >
                <Presentation /> Presentation Mode
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
