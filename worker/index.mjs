import { assets } from "./assets.generated.mjs";
import {
  leadSchema,
  propertySchema,
  contentSchema,
  leadUpdateSchema,
  can,
} from "./validation.mjs";
const contactDefaults = {
  phone: "+92 311 2824467",
  phone2: "+92 335 5818818",
  whatsapp: "923112824467",
  whatsapp2: "923355818818",
  facebook: "https://www.facebook.com/profile.php?id=61596531896362",
  instagram: "",
  youtube: "",
  tiktok: "",
};
const ORIGIN =
  "https://mstar-associates-karachi.fluffy-koala-4479.chatgpt.site";
const publicPaths = [
  "/",
  "/about",
  "/properties",
  "/buy-property",
  "/sell-property",
  "/rent-property",
  "/services",
  "/construction",
  "/development",
  "/property-management",
  "/renovation",
  "/investment",
  "/projects",
  "/contact",
  "/consultation",
  "/valuation",
  "/submit-property",
  "/requirements",
  "/construction-quotation",
  "/insights",
  "/faq",
  "/privacy",
  "/terms",
  "/favorites",
  "/admin",
];
const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; media-src 'self' https:; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com; base-uri 'self'; form-action 'self'",
};
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}
const now = () => new Date().toISOString();
async function body(req) {
  if (+(req.headers.get("content-length") || 0) > 50000)
    throw Object.assign(new Error("Request is too large."), { status: 413 });
  const text = await req.text();
  if (text.length > 50000)
    throw Object.assign(new Error("Request is too large."), { status: 413 });
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error("Please send valid request data."), {
      status: 400,
    });
  }
}
function err(message, status) {
  throw Object.assign(new Error(message), { status });
}
const parseRows = (rows) =>
  rows.map((r) => ({
    ...JSON.parse(r.data),
    id: r.id,
    created_at: r.created_at,
    ...(r.status ? { status: r.status } : {}),
  }));
async function settingMap(db) {
  const { results } = await db.prepare("SELECT key,value FROM settings").all();
  return {
    ...contactDefaults,
    ...Object.fromEntries(results.map((r) => [r.key, r.value])),
  };
}
async function admin(req, env, permission) {
  const id = req.headers.get("oai-authenticated-user-id");
  if (!id) err("Please sign in with your authorized ChatGPT account.", 401);
  let user = await env.DB.prepare("SELECT * FROM admins WHERE user_id=?")
    .bind(id)
    .first();
  if (!user && env.OWNER_PRIVATE_BOOTSTRAP === "1") {
    // Bootstrap is enabled only for this confirmed owner-private Site. Disable it before changing the audience.
    await env.DB.prepare(
      "INSERT OR IGNORE INTO admins(user_id,email,name,role) SELECT ?,?,?, 'owner' WHERE NOT EXISTS (SELECT 1 FROM admins)",
    )
      .bind(
        id,
        req.headers.get("oai-authenticated-user-email") || "",
        decodeName(req),
      )
      .run();
    user = await env.DB.prepare("SELECT * FROM admins WHERE user_id=?")
      .bind(id)
      .first();
  }
  if (!user)
    err(
      "This account is not authorized. Ask your workspace owner to authorize Site user ID: " +
        id,
      403,
    );
  if (permission && !can(user.role, permission))
    err("Your role does not permit this operation.", 403);
  return user;
}
function decodeName(req) {
  const n = req.headers.get("oai-authenticated-user-full-name") || "";
  try {
    return req.headers.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(n)
      : n;
  } catch {
    return "";
  }
}
async function limited(req, env) {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("oai-authenticated-user-id") ||
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip + ":" + Math.floor(Date.now() / 600000)),
  );
  const key = Array.from(new Uint8Array(digest))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
  const expires = Date.now() + 600000;
  await env.DB.prepare(
    "INSERT INTO rate_limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  )
    .bind(key, expires)
    .run();
  const r = await env.DB.prepare("SELECT count FROM rate_limits WHERE key=?")
    .bind(key)
    .first();
  if (r.count > 5)
    err(
      "You have sent several requests. Please try again in ten minutes.",
      429,
    );
  await env.DB.prepare("DELETE FROM rate_limits WHERE expires < ?")
    .bind(Date.now())
    .run();
}
async function upload(req, env, brand = false) {
  if (!env.BUCKET) err("Media storage is not configured.", 503);
  if (+(req.headers.get("content-length") || 0) > 17000000)
    err("Please choose a file smaller than 16 MB.", 413);
  const fd = await req.formData();
  const f = fd.get("file");
  if (!f || typeof f === "string") err("Choose a supported media file.", 400);
  const type = f.type || (/\.glb$/i.test(f.name) ? "model/gltf-binary" : "");
  const image = ["image/png", "image/jpeg", "image/webp"].includes(type);
  const model =
    type === "model/gltf-binary" ||
    (type === "application/octet-stream" && /\.glb$/i.test(f.name));
  const video = ["video/mp4", "video/webm"].includes(type);
  if (
    (brand && !image) ||
    (!image && !model && !video) ||
    f.size > (image ? 8 : 16) * 1024 * 1024
  )
    err(
      brand
        ? "Upload the original PNG, JPG or WebP logo, up to 8 MB."
        : "Use PNG/JPG/WebP up to 8 MB, or MP4/WebM/GLB up to 16 MB.",
      400,
    );
  const bytes = new Uint8Array(await f.arrayBuffer());
  const ascii = (start, end) =>
    new TextDecoder().decode(bytes.slice(start, end));
  let valid = image
    ? type === "image/png"
      ? bytes[0] === 137 && ascii(1, 4) === "PNG"
      : type === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216
        : ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
    : model
      ? ascii(0, 4) === "glTF"
      : type === "video/mp4"
        ? ascii(4, 8) === "ftyp"
        : bytes[0] === 26 &&
          bytes[1] === 69 &&
          bytes[2] === 223 &&
          bytes[3] === 163;
  if (!valid) err("The file does not match its supported media format.", 400);
  if (model) {
    try {
      const data = new DataView(bytes.buffer);
      if (
        data.getUint32(4, true) !== 2 ||
        data.getUint32(8, true) !== bytes.length
      )
        throw 0;
      const length = data.getUint32(12, true);
      const gltf = JSON.parse(ascii(20, 20 + length));
      if (
        [...(gltf.buffers || []), ...(gltf.images || [])].some(
          (item) => item.uri && !item.uri.startsWith("data:"),
        )
      )
        err(
          "Upload a self-contained GLB with embedded textures and buffers.",
          400,
        );
    } catch (e) {
      if (e?.status) throw e;
      err("Upload a valid self-contained GLB 2.0 model.", 400);
    }
  }
  const mime = model ? "model/gltf-binary" : type;
  const id = brand ? "brand-original" : crypto.randomUUID();
  await env.BUCKET.put(id, bytes, { httpMetadata: { contentType: mime } });
  if (!brand)
    await env.DB.prepare(
      "INSERT INTO media(id,name,mime,created_at) VALUES(?,?,?,?)",
    )
      .bind(id, f.name.slice(0, 200), mime, now())
      .run();
  return json({ id, url: brand ? "/api/brand/logo" : "/api/media/" + id }, 201);
}
async function api(req, env, url) {
  const path = url.pathname;
  if (path === "/api/config") {
    if (!env.DB) return json(contactDefaults);
    return json(await settingMap(env.DB));
  }
  if (path === "/api/properties" && req.method === "GET") {
    if (!env.DB) return json([]);
    return json(
      parseRows(
        (
          await env.DB.prepare(
            "SELECT * FROM properties WHERE published=1 ORDER BY created_at DESC",
          ).all()
        ).results,
      ),
    );
  }
  if (path === "/api/content" && req.method === "GET") {
    if (!env.DB) return json([]);
    return json(
      parseRows(
        (
          await env.DB.prepare(
            "SELECT * FROM content WHERE published=1 ORDER BY created_at DESC",
          ).all()
        ).results,
      ),
    );
  }
  if (path.startsWith("/api/brand/") || path.startsWith("/api/media/")) {
    const key = path.startsWith("/api/brand/")
      ? "brand-original"
      : path.slice(11);
    if (!/^[a-zA-Z0-9-]+$/.test(key))
      return json({ error: "Image not found." }, 404);
    let object = env.BUCKET ? await env.BUCKET.get(key) : null;
    if (!object) {
      const local =
        assets["/assets/logo-Photoroom.png"] ||
        assets["/assets/logo.png"] ||
        assets["/assets/logo.jpg"];
      if (key === "brand-original" && local) {
        const response = assetResponse(local, req);
        response.headers.set("Cache-Control", "no-cache");
        return response;
      }
      return new Response(null, { status: 404, headers });
    }
    return new Response(object.body, {
      headers: {
        ...headers,
        "Content-Type": object.httpMetadata?.contentType || "image/png",
        "Cache-Control":
          key === "brand-original" ? "no-cache" : "public,max-age=300",
        ETag: object.httpEtag,
      },
    });
  }
  if (!env.DB)
    err("Secure storage is unavailable. Please try again later.", 503);
  if (path === "/api/leads" && req.method === "POST") {
    await limited(req, env);
    const parsed = leadSchema.safeParse(await body(req));
    if (!parsed.success)
      err(
        parsed.error.issues[0]?.message ||
          "Please review your request details.",
        400,
      );
    const { website, elapsed, ...data } = parsed.data;
    const id = crypto.randomUUID();
    const reference = "MS-" + id.slice(0, 8).toUpperCase();
    await env.DB.prepare(
      "INSERT INTO leads(id,reference,data,status,created_at) VALUES(?,?,?,?,?)",
    )
      .bind(
        id,
        reference,
        JSON.stringify({
          ...data,
          reference,
          notes: "",
          assigned: "",
          followUp: "",
        }),
        "New",
        now(),
      )
      .run();
    return json({ reference }, 201);
  }
  if (path.startsWith("/api/admin/")) {
    const user = await admin(req, env);
    const route = path.slice(11);
    if (route === "me") return json(user);
    if (route === "source" && req.method === "GET") {
      await admin(req, env, "settings");
      const source = assets["/downloads/mstar-source.tar.gz"];
      if (!source) err("Source download is unavailable.", 404);
      const response = assetResponse(source, req);
      response.headers.set(
        "Content-Disposition",
        'attachment; filename="mstar-associates-source.tar.gz"',
      );
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    if (route === "data" && req.method === "GET") {
      const q = async (sql, p) =>
        can(user.role, p) ? (await env.DB.prepare(sql).all()).results : [];
      const [l, p, c, s, u, m] = await Promise.all([
        q("SELECT * FROM leads ORDER BY created_at DESC LIMIT 2000", "leads"),
        q("SELECT * FROM properties ORDER BY created_at DESC", "inventory"),
        q("SELECT * FROM content ORDER BY created_at DESC", "content"),
        can(user.role, "settings") ? settingMap(env.DB) : {},
        can(user.role, "users")
          ? (
              await env.DB.prepare(
                "SELECT user_id,email,name,role FROM admins",
              ).all()
            ).results
          : (await env.DB.prepare("SELECT user_id,name,role FROM admins").all())
              .results,
        q("SELECT * FROM media ORDER BY created_at DESC", "media"),
      ]);
      return json({
        leads: parseRows(l),
        properties: parseRows(p),
        content: parseRows(c),
        settings: s,
        users: u,
        media: m.map((r) => ({ ...r, url: "/api/media/" + r.id })),
      });
    }
    if (route === "properties") {
      await admin(req, env, "inventory");
      if (req.method === "PUT") {
        const parsed = propertySchema.safeParse(await body(req));
        if (!parsed.success)
          err(parsed.error.issues[0]?.message || "Invalid property data.", 400);
        const d = parsed.data;
        await env.DB.prepare(
          "INSERT INTO properties(id,data,published,created_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,published=excluded.published",
        )
          .bind(d.id, JSON.stringify(d), +d.published, now())
          .run();
        return json({ ok: true });
      }
      if (req.method === "PATCH") {
        const { id } = await body(req);
        const r = await env.DB.prepare("SELECT data FROM properties WHERE id=?")
          .bind(String(id))
          .first();
        if (!r) err("Property not found.", 404);
        const d = {
          ...JSON.parse(r.data),
          published: false,
          status: "Archived",
        };
        await env.DB.prepare(
          "UPDATE properties SET data=?,published=0 WHERE id=?",
        )
          .bind(JSON.stringify(d), String(id))
          .run();
        return json({ ok: true });
      }
    }
    if (route === "leads" && req.method === "PATCH") {
      await admin(req, env, "leads");
      const result = leadUpdateSchema.safeParse(await body(req));
      if (!result.success) err("Please review the lead update.", 400);
      const d = result.data;
      const row = await env.DB.prepare("SELECT data FROM leads WHERE id=?")
        .bind(d.id)
        .first();
      if (!row) err("Inquiry not found.", 404);
      await env.DB.prepare("UPDATE leads SET data=?,status=? WHERE id=?")
        .bind(JSON.stringify({ ...JSON.parse(row.data), ...d }), d.status, d.id)
        .run();
      return json({ ok: true });
    }
    if (route === "content" && req.method === "PUT") {
      await admin(req, env, "content");
      const r = contentSchema.safeParse(await body(req));
      if (!r.success)
        err(r.error.issues[0]?.message || "Invalid content.", 400);
      const d = r.data;
      await env.DB.prepare(
        "INSERT INTO content(id,type,slug,data,published,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET type=excluded.type,slug=excluded.slug,data=excluded.data,published=excluded.published",
      )
        .bind(d.id, d.type, d.slug, JSON.stringify(d), +d.published, now())
        .run();
      return json({ ok: true });
    }
    if (route === "settings" && req.method === "PUT") {
      await admin(req, env, "settings");
      const b = await body(req);
      const allowed = [
        "phone",
        "phone2",
        "email",
        "whatsapp",
        "whatsapp2",
        "description",
        "social",
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
      ];
      for (const k of allowed) {
        if (b[k] !== undefined) {
          const v = String(b[k]).trim();
          if (v.length > 500) err("Setting is too long.", 400);
          if (["whatsapp", "whatsapp2"].includes(k) && !/^\d{10,15}$/.test(v))
            err("WhatsApp must include country code and digits only.", 400);
          if (k === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
            err("Please provide a valid email.", 400);
          if (
            ["phone", "phone2"].includes(k) &&
            (!/^\+[\d\s().-]+$/.test(v) ||
              !/^\d{7,15}$/.test(v.replace(/\D/g, "")))
          )
            err(
              "Phone numbers must use international +country-code formatting.",
              400,
            );
          if (
            ["social", "facebook", "instagram", "youtube", "tiktok"].includes(
              k,
            ) &&
            v
          ) {
            let u;
            try {
              u = new URL(v);
            } catch {
              err("Please enter a valid social URL.", 400);
            }
            if (u.protocol !== "https:" || u.username || u.password)
              err("Social links must use HTTPS.", 400);
            const hosts = {
              facebook: ["facebook.com", "www.facebook.com", "m.facebook.com"],
              instagram: ["instagram.com", "www.instagram.com"],
              youtube: ["youtube.com", "www.youtube.com", "youtu.be"],
              tiktok: ["tiktok.com", "www.tiktok.com"],
            };
            if (hosts[k] && !hosts[k].includes(u.hostname.toLowerCase()))
              err("Use an official " + k + " profile URL.", 400);
          }
        }
      }
      await env.DB.batch(
        allowed
          .filter((k) => b[k] !== undefined)
          .map((k) =>
            env.DB.prepare(
              "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            ).bind(k, String(b[k]).trim()),
          ),
      );
      return json({ ok: true });
    }
    if (route === "brand" && req.method === "POST") {
      await admin(req, env, "settings");
      return upload(req, env, true);
    }
    if (route === "media" && req.method === "POST") {
      await admin(req, env, "media");
      return upload(req, env);
    }
    if (route === "users") {
      await admin(req, env, "users");
      const d = await body(req);
      if (req.method === "POST") {
        if (
          !["admin", "editor", "agent"].includes(d.role) ||
          typeof d.user_id !== "string" ||
          d.user_id.length < 3 ||
          d.user_id.length > 150 ||
          typeof d.name !== "string" ||
          d.name.length > 100
        )
          err("Please review team member details.", 400);
        const existing = await env.DB.prepare(
          "SELECT role FROM admins WHERE user_id=?",
        )
          .bind(d.user_id)
          .first();
        if (existing?.role === "owner")
          err("Owner access cannot be changed.", 400);
        await env.DB.prepare(
          "INSERT INTO admins(user_id,name,role) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,role=excluded.role",
        )
          .bind(d.user_id, d.name, d.role)
          .run();
        return json({ ok: true });
      }
      if (req.method === "DELETE") {
        await env.DB.prepare(
          "DELETE FROM admins WHERE user_id=? AND role!='owner'",
        )
          .bind(String(d.user_id))
          .run();
        return json({ ok: true });
      }
    }
    return json({ error: "This operation is not available." }, 405);
  }
  return json({ error: "Not found." }, 404);
}
function assetResponse(a, req) {
  const b = Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0));
  return new Response(req.method === "HEAD" ? null : b, {
    headers: {
      ...headers,
      "Content-Type": a.type,
      "Cache-Control":
        a.type.includes("html") || a.type.includes("json")
          ? "no-cache"
          : "public,max-age=86400",
    },
  });
}
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export default {
  async fetch(req, env, ctx) {
    try {
      const url = new URL(req.url);
      if (req.method === "OPTIONS")
        return new Response(null, { status: 204, headers });
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const origin = req.headers.get("origin");
        if (!origin || origin !== url.origin)
          err("The request origin could not be verified.", 403);
      }
      if (url.pathname.startsWith("/api/")) return await api(req, env, url);
      if (url.pathname === "/robots.txt")
        return new Response(
          "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /favorites\nSitemap: " +
            ORIGIN +
            "/sitemap.xml",
          { headers: { ...headers, "Content-Type": "text/plain" } },
        );
      if (url.pathname === "/sitemap.xml") {
        const paths = publicPaths.filter(
          (p) => !["/admin", "/favorites"].includes(p),
        );
        if (env.DB) {
          const { results } = await env.DB.prepare(
            "SELECT id FROM properties WHERE published=1",
          ).all();
          results.forEach((r) => paths.push("/properties/" + r.id));
          const c = await env.DB.prepare(
            "SELECT slug,type FROM content WHERE published=1 AND type IN ('blog','project')",
          ).all();
          c.results.forEach((r) =>
            paths.push(
              (r.type === "blog" ? "/insights/" : "/projects/") + r.slug,
            ),
          );
        }
        return new Response(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            paths
              .map((p) => "<url><loc>" + escape(ORIGIN + p) + "</loc></url>")
              .join("") +
            "</urlset>",
          { headers: { ...headers, "Content-Type": "application/xml" } },
        );
      }
      if (url.pathname.startsWith("/downloads/"))
        return json(
          {
            error:
              "Please download source from your authorized admin workspace.",
          },
          403,
        );
      const a = assets[url.pathname];
      if (a) return assetResponse(a, req);
      const html = assets["/index.html"];
      if (!html)
        return json({ error: "Application assets are unavailable." }, 503);
      let text = atob(html.data);
      text = new TextDecoder().decode(
        Uint8Array.from(text, (c) => c.charCodeAt(0)),
      );
      let status = 200,
        title =
          url.pathname === "/"
            ? "Beyond Properties. Beyond Expectations."
            : url.pathname
                .split("/")
                .filter(Boolean)
                .map((s) => s.replaceAll("-", " "))
                .join(" · "),
        description =
          "Real estate, construction and development in Karachi. M. Star Associates. Your trusted partner in real estate.";
      let seo = "";
      if (env.DB && url.pathname.startsWith("/properties/")) {
        const r = await env.DB.prepare(
          "SELECT data FROM properties WHERE id=? AND published=1",
        )
          .bind(url.pathname.split("/").pop())
          .first();
        if (r) {
          const p = JSON.parse(r.data);
          title = p.title;
          description = p.description.slice(0, 180);
          seo =
            '<script type="application/ld+json">' +
            JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateListing",
              name: p.title,
              description: p.description,
              url: ORIGIN + url.pathname,
            }).replaceAll("<", "\\u003c") +
            "</script>";
        }
      }
      if (
        !publicPaths.includes(url.pathname) &&
        !/^\/(properties|projects|insights)\/[a-zA-Z0-9-]+$/.test(url.pathname)
      )
        status = 404;
      text = text.replace(
        /<meta name="description" content="[^"]*"\s*\/?\s*>/,
        '<meta name="description" content="' + escape(description) + '"/>',
      );
      text = text.replace(
        /<title>.*?<\/title>/,
        "<title>" + escape(title) + " | M. Star Associates</title>",
      );
      text = text.replace(
        "</head>",
        '<link rel="canonical" href="' +
          escape(ORIGIN + url.pathname) +
          '"/><meta name="robots" content="' +
          (url.pathname.startsWith("/admin") || url.pathname === "/favorites"
            ? "noindex,nofollow"
            : "index,follow") +
          '"/>' +
          seo +
          '<script type="application/ld+json">' +
          JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            name: "M. Star Associates",
            telephone: contactDefaults.phone,
            contactPoint: [
              {
                "@type": "ContactPoint",
                telephone: contactDefaults.phone,
                contactType: "customer service",
              },
              {
                "@type": "ContactPoint",
                telephone: contactDefaults.phone2,
                contactType: "customer service",
              },
            ],
            sameAs: [contactDefaults.facebook],
            url: ORIGIN,
            address: {
              "@type": "PostalAddress",
              streetAddress:
                "Lane 4C, Building No. 4, Office No. 1, Nishat Commercial, Phase 6, DHA",
              addressLocality: "Karachi",
              postalCode: "75500",
              addressCountry: "PK",
            },
            knowsLanguage: ["English", "Urdu", "Sindhi"],
          }) +
          "</script></head>",
      );
      return new Response(req.method === "HEAD" ? null : text, {
        status,
        headers: {
          ...headers,
          "Content-Type": "text/html;charset=utf-8",
          "Cache-Control": "no-cache",
          "X-MStar-Build": assets["/build-info.json"]
            ? JSON.parse(atob(assets["/build-info.json"].data)).sourceHash
            : "unknown",
        },
      });
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error("Request failed", e.name, e.message);
      return json(
        {
          error:
            status === 500
              ? "Something went wrong. Please try again shortly."
              : e.message,
        },
        status,
      );
    }
  },
};
