// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { defineConfig as defineViteConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

const isVercel = process.env.VERCEL === "1";

if (isVercel) {
  process.env.NITRO_PRESET = "vercel";
}

export default defineLovableConfig({
  vite: {
    ssr: {
      noExternal: true,
    },
  },
  cloudflare: !isVercel ? {} : undefined,
  server: {
    port: 5173,
    strictPort: true, // Fail if 5173 is taken, preventing it from jumping to 8080 where the bad SW lives
  },
  tanstackStart: {
    server: { 
      preset: isVercel ? "vercel" : undefined,
      entry: "server" 
    },
  },
});
