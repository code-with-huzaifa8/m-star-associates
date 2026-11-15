import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import worker from "../dist/server/index.js";
import { leadSchema, can } from "../worker/validation.mjs";
const origin =
  "https://mstar-associates-karachi.fluffy-koala-4479.chatgpt.site";
class D1 {
  constructor() {
    this.db = new DatabaseSync(":memory:");
    for (const f of fs
      .readdirSync("drizzle")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      this.db.exec(fs.readFileSync("drizzle/" + f, "utf8"));
  }
  prepare(sql) {
    const self = this;
    let values = [];
    return {
      bind(...v) {
        values = v;
        return this;
      },
      async all() {
        return { results: self.db.prepare(sql).all(...values) };
      },
      async first() {
        return self.db.prepare(sql).get(...values) || null;
      },
      async run() {
        return self.db.prepare(sql).run(...values);
      },
    };
  }
  async batch(statements) {
    return Promise.all(statements.map((s) => s.run()));
  }
}
class Bucket {
  constructor() {
    this.values = new Map();
  }
  async put(id, bytes, options) {
    this.values.set(id, { bytes: new Uint8Array(bytes), ...options });
  }
  async get(id) {
    const v = this.values.get(id);
    return v
      ? { body: v.bytes, httpMetadata: v.httpMetadata, httpEtag: '"test"' }
      : null;
  }
}
const env = () => ({
  DB: new D1(),
  BUCKET: new Bucket(),
  OWNER_PRIVATE_BOOTSTRAP: "1",
});
const request = (path, method = "GET", data, who, extra = {}) =>
  new Request(origin + path, {
    method,
    headers: {
      Origin: origin,
      ...(data instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(who
        ? {
            "oai-authenticated-user-id": who,
            "oai-authenticated-user-email": who + "@example.com",
          }
        : {}),
      ...extra,
    },
    body: data
      ? data instanceof FormData
        ? data
        : JSON.stringify(data)
      : undefined,
  });
const call = (e, ...args) => worker.fetch(request(...args), e, {});
const lead = {
  name: "Test Buyer",
  email: "buyer@example.com",
  phone: "+92 300 1234567",
  kind: "Consultation",
  message: "I am looking for a family home in Karachi.",
  consent: true,
  elapsed: 3000,
  source: "/consultation",
};
const property = {
  id: "verified-1",
  title: "Verified Example",
  area: "DHA Phase 6",
  city: "Karachi",
  type: "House",
  purpose: "Buy",
  price: 100000000,
  beds: 4,
  baths: 5,
  sqyd: 500,
  image: "/assets/villa.jpg",
  featured: true,
  status: "Ready",
  furnished: false,
  amenities: ["Parking"],
  description: "A test property used only in the isolated test database.",
  published: true,
};
test("public page, route metadata, security headers and unknown routes", async () => {
  const e = env();
  let r = await call(e, "/");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Beyond Properties\. Beyond Expectations\./);
  assert.equal(r.headers.get("X-Content-Type-Options"), "nosniff");
  r = await call(e, "/unknown-page");
  assert.equal(r.status, 404);
  r = await call(e, "/sitemap.xml");
  assert.match(await r.text(), /consultation/);
});
test("lead persists and appears in authorized admin workspace", async () => {
  const e = env();
  let r = await call(e, "/api/leads", "POST", lead);
  assert.equal(r.status, 201);
  const saved = await r.json();
  assert.match(saved.reference, /^MS-/);
  await call(e, "/api/admin/me", "GET", null, "owner");
  r = await call(e, "/api/admin/data", "GET", null, "owner");
  const d = await r.json();
  assert.equal(d.leads.length, 1);
  assert.equal(d.leads[0].reference, saved.reference);
  assert.equal(d.leads[0].name, lead.name);
  assert.equal(d.leads[0].status, "New");
});
test("invalid requests, spam and absent consent are rejected", async () => {
  assert.equal(
    leadSchema.safeParse({ ...lead, consent: false }).success,
    false,
  );
  assert.equal(
    leadSchema.safeParse({ ...lead, website: "spam.example" }).success,
    false,
  );
  assert.equal(leadSchema.safeParse({ ...lead, elapsed: 20 }).success, false);
  const e = env();
  const r = await call(e, "/api/leads", "POST", { ...lead, email: "invalid" });
  assert.equal(r.status, 400);
  assert.equal(
    (await e.DB.prepare("SELECT count(*) AS n FROM leads").first()).n,
    0,
  );
});
test("persistent rate limit rejects sixth request", async () => {
  const e = env();
  for (let i = 0; i < 5; i++)
    assert.equal((await call(e, "/api/leads", "POST", lead)).status, 201);
  assert.equal((await call(e, "/api/leads", "POST", lead)).status, 429);
});
test("cross-origin and missing-origin writes are rejected", async () => {
  const e = env();
  let r = await call(e, "/api/leads", "POST", lead, null, {
    Origin: "https://attacker.example",
  });
  assert.equal(r.status, 403);
  const req = new Request(origin + "/api/leads", {
    method: "POST",
    body: JSON.stringify(lead),
  });
  r = await worker.fetch(req, e, {});
  assert.equal(r.status, 403);
});
test("anonymous admin access is denied; only first owner bootstraps", async () => {
  const e = env();
  assert.equal((await call(e, "/api/admin/data")).status, 401);
  let r = await call(e, "/api/admin/me", "GET", null, "owner");
  assert.equal((await r.json()).role, "owner");
  r = await call(e, "/api/admin/me", "GET", null, "stranger");
  assert.equal(r.status, 403);
  assert.equal(
    (await e.DB.prepare("SELECT count(*) AS n FROM admins").first()).n,
    1,
  );
});
test("disabled bootstrap never authorizes a visitor", async () => {
  const e = env();
  e.OWNER_PRIVATE_BOOTSTRAP = "0";
  assert.equal(
    (await call(e, "/api/admin/me", "GET", null, "visitor")).status,
    403,
  );
});
test("owner publishes edits and archives a property", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  let r = await call(e, "/api/admin/properties", "PUT", property, "owner");
  assert.equal(r.status, 200);
  let rows = await (await call(e, "/api/properties")).json();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].demo, false);
  r = await call(
    e,
    "/api/admin/properties",
    "PUT",
    { ...property, price: 125000000 },
    "owner",
  );
  assert.equal(r.status, 200);
  rows = await (await call(e, "/api/properties")).json();
  assert.equal(rows[0].price, 125000000);
  r = await call(
    e,
    "/api/admin/properties",
    "PATCH",
    { id: property.id },
    "owner",
  );
  assert.equal(r.status, 200);
  rows = await (await call(e, "/api/properties")).json();
  assert.equal(rows.length, 0);
  const d = await (
    await call(e, "/api/admin/data", "GET", null, "owner")
  ).json();
  assert.equal(d.properties[0].status, "Archived");
});
test("agent cannot publish inventory or change settings and roles", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  assert.equal(
    (
      await call(
        e,
        "/api/admin/users",
        "POST",
        { user_id: "agent", name: "Agent", role: "agent" },
        "owner",
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(e, "/api/admin/properties", "PUT", property, "agent")).status,
    403,
  );
  assert.equal(
    (await call(e, "/api/admin/settings", "PUT", { phone: "123" }, "agent"))
      .status,
    403,
  );
  assert.equal(
    (
      await call(
        e,
        "/api/admin/users",
        "POST",
        { user_id: "elevated", name: "Bad", role: "admin" },
        "agent",
      )
    ).status,
    403,
  );
  assert.equal(can("editor", "content"), true);
  assert.equal(can("editor", "leads"), false);
});
test("authorized lead status, notes and follow-up persist", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  await call(e, "/api/leads", "POST", lead);
  const data = await (
    await call(e, "/api/admin/data", "GET", null, "owner")
  ).json();
  const id = data.leads[0].id;
  assert.equal(
    (
      await call(
        e,
        "/api/admin/leads",
        "PATCH",
        {
          id,
          status: "Scheduled",
          notes: "Requested a call.",
          assigned: "owner",
          followUp: "2026-12-01",
        },
        "owner",
      )
    ).status,
    200,
  );
  const d = await (
    await call(e, "/api/admin/data", "GET", null, "owner")
  ).json();
  assert.equal(d.leads[0].notes, "Requested a call.");
  assert.equal(d.leads[0].status, "Scheduled");
});
test("content drafts remain private and published articles are exposed", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  const c = {
    id: "c1",
    type: "blog",
    title: "A verified story",
    slug: "verified-story",
    body: "An independently reviewed article for the property journal.",
    image: "/assets/villa.jpg",
    published: false,
  };
  assert.equal(
    (await call(e, "/api/admin/content", "PUT", c, "owner")).status,
    200,
  );
  assert.equal((await (await call(e, "/api/content")).json()).length, 0);
  await call(
    e,
    "/api/admin/content",
    "PUT",
    { ...c, published: true },
    "owner",
  );
  assert.equal(
    (await (await call(e, "/api/content")).json())[0].slug,
    "verified-story",
  );
});
test("logo upload preserves original bytes and uses original as favicon", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  const original = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 12, 34, 56,
  ]);
  const fd = new FormData();
  fd.append(
    "file",
    new Blob([original], { type: "image/png" }),
    "official.png",
  );
  let r = await call(e, "/api/admin/brand", "POST", fd, "owner");
  assert.equal(r.status, 201);
  r = await call(e, "/api/brand/logo");
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), original);
  r = await call(e, "/api/brand/favicon");
  assert.deepEqual(new Uint8Array(await r.arrayBuffer()), original);
});
test("unsupported and forged media are rejected", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  const fd = new FormData();
  fd.append(
    "file",
    new Blob(["<script>bad</script>"], { type: "image/png" }),
    "bad.png",
  );
  assert.equal(
    (await call(e, "/api/admin/media", "POST", fd, "owner")).status,
    400,
  );
});
test("source archive is protected from direct and anonymous access", async () => {
  const e = env();
  assert.equal((await call(e, "/downloads/mstar-source.tar.gz")).status, 403);
  assert.equal((await call(e, "/api/admin/source")).status, 401);
  await call(e, "/api/admin/me", "GET", null, "owner");
  const r = await call(e, "/api/admin/source", "GET", null, "owner");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("Content-Disposition"), /mstar-associates-source/);
});

test("official contact defaults include both lines and only the supplied active social page", async () => {
  const e = env();
  const d = await (await call(e, "/api/config")).json();
  assert.equal(d.phone, "+92 311 2824467");
  assert.equal(d.phone2, "+92 335 5818818");
  assert.equal(d.whatsapp, "923112824467");
  assert.equal(d.whatsapp2, "923355818818");
  assert.equal(
    d.facebook,
    "https://www.facebook.com/profile.php?id=61596531896362",
  );
  for (const k of ["instagram", "youtube", "tiktok"]) assert.equal(d[k], "");
});
test("authorized contact and social updates persist across public config requests", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  const changes = {
    phone2: "+92 333 1234567",
    whatsapp2: "923331234567",
    instagram: "https://www.instagram.com/mstar-associates",
    youtube: "",
    tiktok: "",
  };
  assert.equal(
    (await call(e, "/api/admin/settings", "PUT", changes, "owner")).status,
    200,
  );
  const d = await (await call(e, "/api/config")).json();
  assert.equal(d.phone2, changes.phone2);
  assert.equal(d.whatsapp2, changes.whatsapp2);
  assert.equal(d.instagram, changes.instagram);
  assert.equal(d.youtube, "");
  assert.equal(d.tiktok, "");
  assert.equal(d.phone, "+92 311 2824467");
});
test("invalid phone and unsafe or mismatched social URLs are rejected", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  for (const changes of [
    { whatsapp2: "bad-number" },
    { phone2: "call-me" },
    { instagram: "javascript:alert(1)" },
    { instagram: "https://unrelated.example/profile" },
    { youtube: "http://youtube.com/test" },
    { facebook: "https://facebook.com@attacker.example" },
  ])
    assert.equal(
      (await call(e, "/api/admin/settings", "PUT", changes, "owner")).status,
      400,
    );
});
test("supplied official PNG logo is bundled and served unchanged before any admin upload", async () => {
  const e = env();
  const original = fs.readFileSync("public/assets/logo-Photoroom.png");
  const r = await call(e, "/api/brand/logo");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Content-Type"), "image/png");
  assert.deepEqual(
    new Uint8Array(await r.arrayBuffer()),
    new Uint8Array(original),
  );
  const favicon = await call(e, "/api/brand/favicon");
  assert.deepEqual(
    new Uint8Array(await favicon.arrayBuffer()),
    new Uint8Array(original),
  );
});
test("genuine property gallery, panoramic image, video and model references persist", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  const media = {
    gallery: ["/assets/interior.jpg"],
    panorama: "/api/media/panorama",
    model: "/api/media/model",
    video: "/api/media/video",
  };
  assert.equal(
    (
      await call(
        e,
        "/api/admin/properties",
        "PUT",
        { ...property, ...media },
        "owner",
      )
    ).status,
    200,
  );
  const rows = await (await call(e, "/api/properties")).json();
  assert.deepEqual(rows[0].gallery, media.gallery);
  assert.equal(rows[0].panorama, media.panorama);
  assert.equal(rows[0].model, media.model);
  assert.equal(rows[0].video, media.video);
});
function glb(document) {
  let data = Buffer.from(JSON.stringify(document));
  const pad = (4 - (data.length % 4)) % 4;
  data = Buffer.concat([data, Buffer.alloc(pad, 32)]);
  const result = Buffer.alloc(20 + data.length);
  result.write("glTF", 0);
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(data.length, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  data.copy(result, 20);
  return result;
}
test("self-contained GLB uploads are stored while external asset dependencies are rejected", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  for (const [doc, expected] of [
    [{ asset: { version: "2.0" }, scenes: [{}] }, 201],
    [
      {
        asset: { version: "2.0" },
        buffers: [{ uri: "https://unrelated.example/data.bin" }],
      },
      400,
    ],
  ]) {
    const fd = new FormData();
    fd.append(
      "file",
      new Blob([glb(doc)], { type: "model/gltf-binary" }),
      "property.glb",
    );
    const r = await call(e, "/api/admin/media", "POST", fd, "owner");
    assert.equal(r.status, expected);
    if (expected === 201) {
      const d = await r.json();
      const fetched = await call(e, d.url);
      assert.equal(fetched.headers.get("Content-Type"), "model/gltf-binary");
    }
  }
});
test("reference-safe uploaded property videos are stored with video MIME types", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  const fd = new FormData();
  fd.append(
    "file",
    new Blob(
      [Uint8Array.from([0, 0, 0, 24, 102, 116, 121, 112, 105, 115, 111, 109])],
      { type: "video/mp4" },
    ),
    "property.mp4",
  );
  const r = await call(e, "/api/admin/media", "POST", fd, "owner");
  assert.equal(r.status, 201);
  const d = await r.json();
  const fetched = await call(e, d.url);
  assert.equal(fetched.headers.get("Content-Type"), "video/mp4");
});

test("admin-managed offers publish with same-site destinations and reject external redirects", async () => {
  const e = env();
  await call(e, "/api/admin/me", "GET", null, "owner");
  const offer = {
    id: "offer-1",
    type: "offer",
    title: "Property consultation",
    slug: "property-consultation",
    body: "Discuss your verified requirements with the team.",
    image: "/assets/architecture.jpg",
    link: "/consultation",
    published: true,
  };
  assert.equal(
    (await call(e, "/api/admin/content", "PUT", offer, "owner")).status,
    200,
  );
  const rows = await (await call(e, "/api/content")).json();
  assert.equal(rows[0].type, "offer");
  assert.equal(rows[0].link, "/consultation");
  for (const link of [
    "https://unrelated.example",
    "//unrelated.example",
    "/\\unrelated.example",
  ])
    assert.equal(
      (await call(e, "/api/admin/content", "PUT", { ...offer, link }, "owner"))
        .status,
      400,
    );
});

test("build identity is exposed without cache so previews can be matched to their deployed source", async () => {
  const e = env();
  const r = await call(e, "/build-info.json");
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.match(data.sourceHash, /^[a-f0-9]{64}$/);
  assert.equal(r.headers.get("Cache-Control"), "no-cache");
  const page = await call(e, "/");
  assert.equal(page.headers.get("X-MStar-Build"), data.sourceHash);
});
