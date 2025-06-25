import { useEffect, useState } from "react";

export const usePreviewUrl = (
  values: Record<string, any>,
  basePath: string = ""
) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    params.set("nocontrols", "true");

    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined && value !== null) {
        params.set(key, value.toString());
      }
    }

    const fullUrl = `${
      basePath || window.location.pathname
    }?${params.toString()}`;
    setUrl(fullUrl);
  }, [values, basePath]);

  return url;
};
