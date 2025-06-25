export const getUrlParams = () => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const entries: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    entries[key] = value;
  }
  return entries;
};

export const parseValue = (str: string | null, fallback: any) => {
  if (str == null) return fallback;
  if (typeof fallback === "number") return parseFloat(str);
  if (typeof fallback === "boolean") return str === "true";
  return str;
};
