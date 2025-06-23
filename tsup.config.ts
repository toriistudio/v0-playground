import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    target: "esnext",
  },
  {
    entry: {
      preset: "src/preset.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    clean: false,
    target: "esnext",
  },
]);
