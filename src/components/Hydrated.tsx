import { useState, useEffect } from "react";

export const Hydrated = ({ children }: { children: React.ReactNode }) => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;
  return <>{children}</>;
};
