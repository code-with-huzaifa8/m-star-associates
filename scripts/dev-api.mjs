// Local-only persistence for browser QA; production uses the hosted D1/R2 bindings.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import worker from "../dist/server/index.js";
export function createDevelopmentApi() {
  fs.mkdirSync("work/dev-media", { recursive: true });
  const db = new DatabaseSync("work/dev.sqlite");
  db.exec(
    "CREATE TABLE IF NOT EXISTS __local_migrations(name TEXT PRIMARY KEY)",
  );
  for (const file of fs
    .readdirSync("drizzle")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (
      !db.prepare("SELECT name FROM __local_migrations WHERE name=?").get(file)
    ) {
      db.exec(fs.readFileSync(path.join("drizzle", file), "utf8"));
      db.prepare("INSERT INTO __local_migrations(name) VALUES(?)").run(file);
    }
  }
  const DB = {
    prepare(sql) {
      let values = [];
      return {
        bind(...v) {
          values = v;
          return this;
        },
        async first() {
          return db.prepare(sql).get(...values) || null;
        },
        async all() {
          return { results: db.prepare(sql).all(...values) };
        },
        async run() {
          return db.prepare(sql).run(...values);
        },
      };
    },
    async batch(items) {
      return Promise.all(items.map((s) => s.run()));
    },
  };
  const BUCKET = {
    async put(key, bytes, options) {
      if (!/^[\w-]+$/.test(key)) throw new Error("Invalid storage key");
      fs.writeFileSync("work/dev-media/" + key, bytes);
      fs.writeFileSync(
        "work/dev-media/" + key + ".json",
        JSON.stringify(options.httpMetadata || {}),
      );
    },
    async get(key) {
      if (!/^[\w-]+$/.test(key) || !fs.existsSync("work/dev-media/" + key))
        return null;
      return {
        body: new Uint8Array(fs.readFileSync("work/dev-media/" + key)),
        httpMetadata: JSON.parse(
          fs.readFileSync("work/dev-media/" + key + ".json", "utf8"),
        ),
        httpEtag: '"local-media"',
      };
    },
  };
  return async (req, res, next) => {
    if (!req.url?.startsWith("/api/")) return next();
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value && !key.toLowerCase().startsWith("oai-"))
          headers.set(key, Array.isArray(value) ? value.join(",") : value);
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 17 * 1024 * 1024) {
          res.statusCode = 413;
          res.end("File too large");
          return;
        }
        chunks.push(chunk);
      }
      const method = req.method || "GET";
      const request = new Request("http://" + req.headers.host + req.url, {
        method,
        headers,
        body: ["GET", "HEAD"].includes(method)
          ? undefined
          : Buffer.concat(chunks),
      });
      const result = await worker.fetch(
        request,
        { DB, BUCKET, OWNER_PRIVATE_BOOTSTRAP: "0" },
        {},
      );
      res.statusCode = result.status;
      result.headers.forEach((value, key) => res.setHeader(key, value));
      res.end(Buffer.from(await result.arrayBuffer()));
    } catch (error) {
      console.error("Local API error:", error.message);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ error: "Local development API is unavailable." }),
      );
    }
  };
}
