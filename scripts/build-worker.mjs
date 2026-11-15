import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
fs.mkdirSync("dist/client/downloads", { recursive: true });
execFileSync("tar", [
  "-czf",
  "dist/client/downloads/mstar-source.tar.gz",
  "--exclude=worker/assets.generated.mjs",
  "index.html",
  "src",
  "public",
  "worker",
  "db",
  "drizzle",
  "scripts",
  "tests",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "playwright.config.mjs",
  "drizzle.config.ts",
  "eslint.config.js",
  ".env.example",
  ".gitignore",
  "README.md",
]);
import { build } from "esbuild";
const types = {
  ".html": "text/html;charset=utf-8",
  ".json": "application/json",
  ".js": "application/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".gz": "application/gzip",
};
const sourceHash = createHash("sha256");
function fingerprint(dir) {
  for (const entry of fs.readdirSync(dir).sort()) {
    const file = path.join(dir, entry);
    if (file.endsWith("assets.generated.mjs")) continue;
    if (fs.statSync(file).isDirectory()) fingerprint(file);
    else sourceHash.update(file).update(fs.readFileSync(file));
  }
}
for (const dir of ["src", "public", "worker"]) fingerprint(dir);
fs.writeFileSync(
  "dist/client/build-info.json",
  JSON.stringify({
    sourceHash: sourceHash.digest("hex"),
    builtAt: new Date().toISOString(),
  }),
);
const assets = {};
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else
      assets["/" + path.relative("dist/client", p).replaceAll("\\", "/")] = {
        type: types[path.extname(p)] || "application/octet-stream",
        data: fs.readFileSync(p).toString("base64"),
      };
  }
}
walk("dist/client");
fs.writeFileSync(
  "worker/assets.generated.mjs",
  "export const assets=" + JSON.stringify(assets) + ";",
);
fs.mkdirSync("dist/server", { recursive: true });
await build({
  entryPoints: ["worker/index.mjs"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
});
fs.rmSync("worker/assets.generated.mjs");

console.log(
  "Worker built with",
  Object.keys(assets).length,
  "embedded assets.",
);
