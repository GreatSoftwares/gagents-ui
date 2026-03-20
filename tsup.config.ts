import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@tanstack/react-query",
    "@tanstack/react-table",
    "lucide-react",
    "date-fns",
    "sonner",
    "@greatapps/greatauth-ui",
    "@dnd-kit/core",
    "@dnd-kit/modifiers",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
    "radix-ui",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
