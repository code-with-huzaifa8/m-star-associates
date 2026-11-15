# M. Star Associates

A complete responsive real estate application for Karachi, with a cinematic public website, seven service experiences, property search and comparisons, editorial content, durable lead capture, and an authenticated team workspace.

## Runtime and architecture

- React 19, TypeScript, Vite and GSAP, custom responsive design, Lucide icons.
- A Cloudflare Worker ES module serves assets, route metadata, API endpoints, sitemap and security headers.
- Cloudflare D1 stores listings, leads, appointments, content, settings, roles and media metadata. Drizzle owns the schema and generated migration.
- Cloudflare R2 stores original media and the original logo. Uploaded logo bytes are served unchanged, with CSS `object-fit: contain`; the original file is also used as the favicon.
- Sites supplies authentication and owner-private hosting. Application roles are checked on every admin operation.
- No Supabase, PostgreSQL, Prisma, external email account or Google Maps API key is required by this implementation. The deployed stack uses Workers/D1 rather than the brief's preferred Next.js/PostgreSQL stack. Moving to Vercel would require a backend/database adapter; it is not a drop-in Vercel deployment.

## Local development

Use Node.js 22.13+ and npm. Run `npm ci`, then `npm run dev` for the Vite public UI. The Vite server now includes a local API adapter using `work/dev.sqlite` and local media storage. Production data is not used. Administrative routes stay protected; local requests cannot spoof platform identity headers. Build once before the first `npm run dev`, because the local adapter uses the compiled Worker. Use `npm run build` to type-check and create `dist/server/index.js`. `tar` is required to create the downloadable source archive. `npm test` runs critical API integration checks against an isolated in-memory SQLite database and memory object store. `npm run db:generate` generates a new schema migration after intentional changes to `db/schema.ts`.

For a full local Worker environment, install Wrangler separately and configure D1 binding `DB` and R2 binding `BUCKET`, then apply the SQL in `drizzle/` to the local database. The build has embedded assets, so no asset binding is needed. Hosted authentication headers must only be injected by a trusted reverse proxy; do not expose a raw Worker that trusts arbitrary client-supplied identity headers. Local development must never be exposed as a production admin service.

## Admin setup and access

1. Open `/admin` on the confirmed owner-private Site and sign in with the Site owner's ChatGPT account.
2. `OWNER_PRIVATE_BOOTSTRAP=1` authorizes the first authenticated account only while the Site's external access boundary is owner-only. The first user is saved as `owner`; the bootstrap never grants a second owner.
3. Open Settings to review both preconfigured official phone and WhatsApp lines and the official Facebook page. Add an email address and future social URLs when available. The official circular logo is already bundled; future authorized updates can be uploaded under **The original. Beautifully preserved.**
4. Add authorized users by their Site-specific user ID. Owners manage users; admins manage business data; editors manage inventory/content/media; agents manage leads and appointments. Unauthorized accounts receive their own Site ID in the access-denied response.
5. **Disable `OWNER_PRIVATE_BOOTSTRAP` before making the Site public or broadening its audience.** If no authorized owner is present, do not enable bootstrap on a public Site. Establish access under owner-private permissions first.
6. Published listings and content are durable and available to public views. Archives retain records while unpublishing them. Archived leads remain accessible to authorized staff. CSV exports neutralize spreadsheet formula prefixes.

## Brand assets and truthful content

The official circular logo was recovered from the user-supplied official Facebook page (`https://www.facebook.com/profile.php?id=61596531896362`), then visually matched to the original reference. Its downloaded original JPEG bytes are bundled unchanged in `public/assets/logo.jpg`. Navigation, footer, loader, favicon and admin all serve this same file through `/api/brand/logo` (or an unchanged admin-uploaded replacement). No cropping, recoloring, stretching, tracing, background removal or AI redrawing is performed. The original white logo background is retained as part of the supplied artwork.

The public site and admin use obsidian, midnight navy, electric blue, champagne and metallic gold. The lazy-loaded Three.js hero is an original procedural two-storey villa concept, with real geometry, glazing, gold sunshades, warm interiors, a courtyard and pool. It is explicitly a design concept, not a model of an available listing. Visitors can drag to rotate, switch elevations, zoom, reset or expand the presentation. Reduced-motion preferences, data-saving settings, lower device capabilities, WebGL failure and poor measured frame rates trigger an architectural image fallback, labeled as inspiration. CSS pointer depth, GSAP ScrollTrigger parallax, magnetic CTAs and progressive reveals respect reduced motion.

Both official telephone and WhatsApp lines are configured: +92 311 2824467 / 923112824467 and +92 335 5818818 / 923355818818. Contact pages, property inquiries, footer and a selectable floating contact widget use the admin-editable configuration. Facebook is active at the supplied official page. Instagram, YouTube and TikTok are clearly marked coming soon with no fabricated URLs; saving a valid official platform URL in Settings activates its icon. Server validation rejects unsafe or mismatched social URLs.

Property editors can supply additional gallery photographs, a real 2:1 equirectangular panorama, a self-contained GLB 2.0 model and an MP4/WebM video. No experience button appears without a configured asset. Panoramas and models use on-demand interactive viewers with rotate/look, zoom, reset and supported native full-screen controls. Upload limits are 8 MB for PNG/JPG/WebP and 16 MB for MP4/WebM/GLB. GLB uploads are checked for version, length, valid JSON and embedded resource dependencies. Larger externally hosted media needs HTTPS and the host's CORS support.

Initial listings, prices, dimensions and architecture are conspicuously labeled sample or inspiration. They are not actual inventory, completed work, testimonials or investment offers. Stock architecture photographs are not identified as photographs of Karachi properties. Replace samples with verified listings as they become available. The company's supplied address and services are preserved. The two supplied phone and WhatsApp numbers and official Facebook page are configured; no email address or future social profiles have been invented.

## Public pages and tools

Home, about, property collection, detail pages, buy/rent searches, selling, services, construction, development, management, renovation, investment, project inspiration and detail pages, property journal and articles, FAQ, contact, consultation, valuation, property submission, requirements, construction quotation, saved properties, privacy and terms.

Filters cover location, type, purpose, PKR price, bedrooms/bathrooms, area, furnishing, status and amenities. Area conversions use 1 sq. yd. = 9 sq. ft.; 1 marla = 272.25 sq. ft.; 1 kanal = 20 marla. These conventions are stated and should be verified against actual title records. Grid/list modes, sorting, pagination, device-local favorites, three-property comparison, image galleries and link sharing are implemented.

Exact map coordinates, tours, floor plans, brochures and before/after comparisons are deliberately not fabricated. Real panoramic/model/video media can be configured through admin as described above. The map view explains why no sample pins exist and provides an external area map link. The floating contact panel offers both WhatsApp numbers, both click-to-call lines and the inquiry form. No email or SMS notification is claimed; new requests are visible in admin immediately. Add a transactional provider for external notifications if needed.

## Data protection and validation

Public forms require consent, server-side Zod validation, a honeypot, minimum form completion time and a persistent per-IP ten-minute rate limit. IP addresses are hashed for rate-limit keys and never stored in leads. Writes require a matching Origin. All DB statements use parameter binding. Media accepts PNG/JPG/WebP (8 MB) and MP4/WebM/GLB (16 MB), with format signature checks and self-contained GLB validation. Server authorization is enforced separately from UI navigation. Production errors do not disclose internals. No optional tracking is enabled.

Review privacy/terms with local counsel before public business launch. Retention and deletion requests can be fulfilled by authorized database administration; automated retention and notification providers are not configured.

## Deployment

The Site ID is retained in `.openai/hosting.json`. Build with `npm run build`; package `dist/server/index.js`, `.openai/hosting.json` and the `drizzle/` migration folder, then save/deploy the exact pushed source commit using Sites. D1/R2 bindings must be provisioned by the hosting platform. Secrets never belong in this repository. `.env.example` documents the bootstrap variable only.

The admin sidebar provides a protected download of this full source tree, including schema, migrations and tests. Direct downloads outside the authorized endpoint are denied.

## Verification and limits

TypeScript checking, production build and critical API integration tests are provided. Browser QA is now available through the project’s Playwright runner and installed Chromium, launched explicitly for the user-requested rendered checks. `npm run test:e2e` checks desktop, tablet and mobile menus, keyboard and outside dismissal, navigation, image proportions, WebGL camera controls, and reduced-motion fallback. The managed preview relay failed, so these checks use the local development server. Lighthouse scores have not been measured. The three supplied reference recordings each exceed the file-transfer tool’s 32 MiB limit and could not be opened. The written transformation brief, the recovered logo, and the publicly accessible Bitrupt page informed the design; no Bitrupt code or artwork was reused. No email notification, real listing availability, completed company project, external analytics or investment return is claimed.

## Photography credits

Architecture imagery is served locally from Unsplash: photo IDs 1613977257363-707ba9348227, 1613977257592-4871e5fcd7c4, 1600210492486-724fe5c67fb0, 1600607687920-4e2a09cf159d, 1497366754035-f200968a6e72, 1600566753086-00f18fb6b3ea and 1600607687939-ce8a6c25118c. Images are visual inspiration, not verified company properties or projects.


## Navigation and current branding limitation

Services and Offers are full three-column, animated desktop panels with mobile accordions, focus handling, keyboard activation, Escape and outside dismissal. Published `offer` content in Admin → Content appears in Offers; destinations must be same-site paths. Without published offers, the menu shows discovery categories and explicitly labeled architectural inspiration. Latest Listings now applies the newest-publication sort.

The exact `logo-Photoroom.png` shown inline in chat has not been delivered as a readable file. It has not been recreated or substituted. Responsive horizontal-logo detection and native 2x display caps are implemented and preserve the full original image. The server prioritizes a bundled `/assets/logo-Photoroom.png`, then `/assets/logo.png`, then the existing JPEG. An authorized image uploaded in Admin → Settings takes precedence over bundled artwork. Upload the exact transparent PNG there to finish replacement without any pixel alteration. The circular JPEG is excluded from the navbar. Until the exact horizontal PNG is supplied, the navbar uses a plain company-name label, not recreated logo artwork. Other existing branding assets remain archived.

“Request Edits” does not exist in this application’s source or rendered DOM. The surrounding hosting/editor interface owns that control; it cannot be repaired by editing this repository.


The current build exposes `/build-info.json` with a source fingerprint and build timestamp, and returns `X-MStar-Build` on HTML responses. Both diagnostics and HTML avoid long-lived caching. The deployed fingerprint is checked against the packaged local build to distinguish an outdated preview from a source implementation issue. Fonts are served locally from `public/assets/fonts`, including their OFL license files.
