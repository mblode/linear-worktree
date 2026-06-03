import { defineConfig } from "tsdown";

export default defineConfig([
  {
    banner: { js: "#!/usr/bin/env node" },
    clean: true,
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    hash: false,
    sourcemap: true,
    target: "node22",
  },
  {
    clean: false,
    entry: { index: "src/index.ts" },
    format: ["esm"],
    hash: false,
    sourcemap: true,
    target: "node22",
  },
]);
