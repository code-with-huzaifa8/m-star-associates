
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "mstar-local-api",
      apply: "serve",
      async configureServer(server) {
        const { createDevelopmentApi } = await import(
          pathToFileURL(resolve("scripts/dev-api.mjs")).href
        );

        server.middlewares.use(createDevelopmentApi());
      },
    },
  ],
  build: { outDir: "dist/client" },
  server: { allowedHosts: true },
});
