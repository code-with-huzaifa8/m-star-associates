import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Plus,
  Search,
  ArrowDownToLine,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Image,
  Trash2,
  CheckCircle2,
  Upload,
  LockKeyhole,
  ExternalLink,
  Clock,
} from "lucide-react";
import { money, type Property } from "./data";
import { contactConfig } from "./contact";
import { FormField, Modal } from "./main";
type Props = {
  brand: React.ReactNode;
  properties: Property[];
  notify: (s: string) => void;
};
export function Admin({ brand }: Props) {
  const [me, setMe] = useState<any>(null);
  const [authError, setAuthError] = useState("");
  const [section, setSection] = useState(
    new URLSearchParams(location.search).get("section") === "Settings"
      ? "Settings"
      : "Overview",
  );
  const [leads, setLeads] = useState<any[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [leadFilter, setLeadFilter] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [side, setSide] = useState(false);
  const [busy, setBusy] = useState(false);
  async function api(path: string, method = "GET", body?: any) {
    const r = await fetch("/api/admin/" + path, {
      method,
      headers:
        body instanceof FormData
          ? undefined
          : { "Content-Type": "application/json" },
      body: body
        ? body instanceof FormData
          ? body
          : JSON.stringify(body)
        : undefined,
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Request failed");
    return d;
  }
  async function refresh() {
    try {
      const d = await api("data");
      setLeads(d.leads);
      setProperties(d.properties);
      setContent(d.content);
      setSettings(contactConfig(d.settings));
      setUsers(d.users || []);
      setMedia(d.media || []);
    } catch (e: any) {
      setMessage(e.message);
    }
  }
  useEffect(() => {
    api("me")
      .then((d) => {
        setMe(d);
        refresh();
      })
      .catch((e) => {
        setAuthError(e.message);
        setMe(false);
      });
  }, []);
  async function action(fn: () => Promise<any>, msg = "Saved successfully.") {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setMessage(msg);
      await refresh();
      return true;
    } catch (e: any) {
      setMessage(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (me === null)
    return (
      <div className="admin-auth">
        <div>
          {brand}
          <div className="admin-loading" />
          <p>Opening your workspace…</p>
        </div>
      </div>
    );
  if (!me)
    return (
      <div className="admin-auth">
        <div className="admin-auth-card">
          {brand}
          <span className="admin-label">PRIVATE WORKSPACE</span>
          <LockKeyhole size={38} strokeWidth={1} />
          <h1>
            A considered space.
            <br />
            <em>For your team.</em>
          </h1>
          <p>
            {authError ||
              "Sign in with your authorized account to access the M. Star Associates workspace."}
          </p>
          <a
            className="button navy"
            href="/signin-with-chatgpt?return_to=%2Fadmin"
            target="_top"
          >
            Sign in with ChatGPT <ArrowUpRight size={17} />
          </a>
          <a href="/" className="text-link">
            Return to Website <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="admin-auth-photo">
          <img src="/assets/architecture.jpg" alt="Architectural inspiration" />
          <span>CLARITY. CARE. CONSIDERED POSSIBILITIES.</span>
        </div>
      </div>
    );
  const allowedSections: Record<string, string[]> = {
    owner: [
      "Overview",
      "Properties",
      "Leads",
      "Appointments",
      "Content",
      "Media",
      "Settings",
    ],
    admin: [
      "Overview",
      "Properties",
      "Leads",
      "Appointments",
      "Content",
      "Media",
      "Settings",
    ],
    editor: ["Overview", "Properties", "Content", "Media"],
    agent: ["Overview", "Leads", "Appointments"],
  };
  const nav = [
    [LayoutDashboard, "Overview"],
    [Building2, "Properties"],
    [Users, "Leads"],
    [CalendarDays, "Appointments"],
    [FileText, "Content"],
    [Image, "Media"],
    [Settings, "Settings"],
  ];
  const filtered = leads.filter(
    (l) =>
      (!leadFilter || l.status === leadFilter) &&
      (!query ||
        `${l.name} ${l.email} ${l.reference} ${l.kind}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const appointments = leads.filter(
    (l) => l.kind === "Viewing request" || l.kind === "Consultation",
  );
  function csv() {
    const rows = [
      [
        "Reference",
        "Name",
        "Email",
        "Phone",
        "Type",
        "Status",
        "Assigned",
        "Follow up",
        "Created",
      ],
      ...filtered.map((l) => [
        l.reference,
        l.name,
        l.email,
        l.phone,
        l.kind,
        l.status,
        l.assigned || "",
        l.followUp || "",
        l.created_at,
      ]),
    ];
    const safe = (v: any) => {
      const s = String(v ?? "");
      return (
        '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'
      );
    };
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map(safe).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mstar-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="admin-shell">
      <aside className={"admin-sidebar " + (side ? "show" : "")}>
        <div className="admin-sidebar-brand">
          {brand}
          <span>PRIVATE WORKSPACE</span>
          <button
            className="admin-close"
            onClick={() => setSide(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        <nav>
          {nav
            .filter(([, n]) => allowedSections[me.role]?.includes(String(n)))
            .map(([I, n]: any) => (
              <button
                className={section === n ? "selected" : ""}
                onClick={() => {
                  setSection(n);
                  setQuery("");
                  setSide(false);
                }}
                key={n}
              >
                <I size={17} />
                {n}
                {n === "Leads" &&
                  leads.filter((l) => l.status === "New").length > 0 && (
                    <b>{leads.filter((l) => l.status === "New").length}</b>
                  )}
              </button>
            ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/" target="_blank">
            View Website <ExternalLink size={14} />
          </a>
          {["owner", "admin"].includes(me.role) && (
            <a href="/api/admin/source" download>
              Download Source <ArrowDownToLine size={14} />
            </a>
          )}
          <div>
            <ShieldCheck size={17} />
            <span>
              Secure workspace
              <br />
              <b>{me.role}</b>
            </span>
          </div>
          <a href="/signout-with-chatgpt?return_to=%2F" target="_top">
            <LogOut size={14} /> Sign out
          </a>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-toggle"
            onClick={() => setSide(!side)}
            aria-label="Open sidebar"
          >
            <Menu />
          </button>
          <div>
            M. Star Associates <ChevronRight size={12} /> <b>{section}</b>
          </div>
          <div className="admin-profile">
            <span>{(me.name || me.email || "M").charAt(0).toUpperCase()}</span>
            <div>
              {me.name || me.email}
              <small>{me.role}</small>
            </div>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-heading">
            <div>
              <span className="admin-label">
                YOUR BUSINESS, THOUGHTFULLY MANAGED
              </span>
              <h1>
                {section === "Overview"
                  ? "A clearer perspective."
                  : section + "."}
              </h1>
              <p>
                {section === "Overview"
                  ? "Welcome to your M. Star Associates workspace."
                  : "Manage your " +
                    section.toLowerCase() +
                    " with clarity and care."}
              </p>
            </div>
            {section === "Properties" && (
              <button
                className="button navy"
                onClick={() =>
                  setEditing({
                    kind: "property",
                    data: {
                      id: crypto.randomUUID(),
                      title: "",
                      area: "",
                      city: "Karachi",
                      type: "House",
                      purpose: "Buy",
                      price: 0,
                      beds: 0,
                      baths: 0,
                      sqyd: 0,
                      image: "",
                      featured: false,
                      status: "Draft",
                      demo: false,
                      furnished: false,
                      amenities: [],
                      description: "",
                      published: false,
                    },
                  })
                }
              >
                <Plus size={16} /> Add Property
              </button>
            )}
            {section === "Content" && (
              <button
                className="button navy"
                onClick={() =>
                  setEditing({
                    kind: "content",
                    data: {
                      id: crypto.randomUUID(),
                      type: "blog",
                      title: "",
                      slug: "",
                      body: "",
                      image: "",
                      published: false,
                    },
                  })
                }
              >
                <Plus size={16} /> Create Content
              </button>
            )}
          </div>
          {message && (
            <div role="status" className="admin-message">
              {message}
              <button onClick={() => setMessage("")} aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          )}
          {section === "Overview" && (
            <>
              <div className="admin-stats">
                {[
                  [
                    Building2,
                    properties.filter((p: any) => p.published).length,
                    "Published listings",
                  ],
                  [
                    Users,
                    leads.filter((l) => l.status === "New").length,
                    "New inquiries",
                  ],
                  [
                    CalendarDays,
                    appointments.filter((l) => l.status === "New").length,
                    "Appointment requests",
                  ],
                  [
                    FileText,
                    content.filter((c) => c.published).length,
                    "Published stories",
                  ],
                ].map(([I, n, l]: any) => (
                  <div key={l}>
                    <I size={22} strokeWidth={1.2} />
                    <strong>{n}</strong>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <div className="admin-overview-grid">
                <section className="admin-panel">
                  <div className="admin-panel-title">
                    <h3>Recent inquiries</h3>
                    <button
                      className="text-link"
                      onClick={() => setSection("Leads")}
                    >
                      View All <ArrowUpRight size={14} />
                    </button>
                  </div>
                  {leads.length ? (
                    <div className="admin-recent">
                      {leads.slice(0, 5).map((l) => (
                        <button key={l.id} onClick={() => setLead(l)}>
                          <span className="lead-avatar">
                            {l.name.charAt(0)}
                          </span>
                          <span>
                            <b>{l.name}</b>
                            <small>{l.kind}</small>
                          </span>
                          <span
                            className={"status-badge " + l.status.toLowerCase()}
                          >
                            {l.status}
                          </span>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <AdminEmpty
                      icon={Users}
                      title="Your next conversation starts here."
                      text="New website inquiries will appear in your workspace after visitors submit a form."
                    />
                  )}
                </section>
                <section className="admin-panel">
                  <div className="admin-panel-title">
                    <h3>Lead sources</h3>
                    <span>All time</span>
                  </div>
                  {leads.length ? (
                    <div className="source-bars">
                      {[
                        ...new Set(leads.map((l) => l.source || "/contact")),
                      ].map((s) => (
                        <div key={s}>
                          <span>{s}</span>
                          <b>{leads.filter((l) => l.source === s).length}</b>
                          <i
                            style={{
                              width:
                                (100 *
                                  leads.filter((l) => l.source === s).length) /
                                  leads.length +
                                "%",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <AdminEmpty
                      icon={ChartIcon}
                      title="Room for a fresh perspective."
                      text="Actual inquiry sources appear here as requests arrive. No sample metrics are included."
                    />
                  )}
                </section>
              </div>
              <div className="admin-quick">
                <h3>A thoughtful next step.</h3>
                <p>
                  Add verified listings, configure your contact details, or
                  upload your original brand artwork.
                </p>
                <button
                  className="text-link"
                  onClick={() => setSection("Settings")}
                >
                  Complete Your Settings <ArrowUpRight size={16} />
                </button>
              </div>
            </>
          )}
          {section === "Properties" && (
            <section className="admin-panel">
              <div className="admin-filter">
                <Search size={16} />
                <input
                  placeholder="Search your properties"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {properties.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties
                        .filter((p) =>
                          `${p.title} ${p.id}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                        )
                        .map((p: any) => (
                          <tr key={p.id}>
                            <td>
                              <div className="table-property">
                                {p.image && <img src={p.image} alt="" />}
                                <span>
                                  <b>{p.title}</b>
                                  <small>{p.id}</small>
                                </span>
                              </div>
                            </td>
                            <td>{p.area}</td>
                            <td>PKR {money(p.price)}</td>
                            <td>
                              <span className="status-badge">
                                {p.published
                                  ? "Published"
                                  : p.status === "Archived"
                                    ? "Archived"
                                    : "Draft"}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() =>
                                  setEditing({ kind: "property", data: p })
                                }
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  setEditing({ kind: "archive", data: p })
                                }
                              >
                                Archive
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <AdminEmpty
                  icon={Building2}
                  title="A collection, waiting to be curated."
                  text="Add your first verified property. Sample listings are separate from the live inventory."
                />
              )}
            </section>
          )}
          {(section === "Leads" || section === "Appointments") && (
            <section className="admin-panel">
              <div className="admin-filter">
                <Search size={16} />
                <input
                  placeholder="Search names, references or inquiry types"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  aria-label="Filter status"
                  value={leadFilter}
                  onChange={(e) => setLeadFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {[
                    "New",
                    "Contacted",
                    "Qualified",
                    "Scheduled",
                    "Closed",
                    "Archived",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button onClick={csv}>
                  <ArrowDownToLine size={15} /> Export CSV
                </button>
              </div>
              {(section === "Leads"
                ? filtered
                : filtered.filter((l) => appointments.includes(l))
              ).length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Contact</th>
                        <th>Request</th>
                        <th>Received</th>
                        <th>Status</th>
                        <th>Assigned</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {(section === "Leads"
                        ? filtered
                        : filtered.filter((l) => appointments.includes(l))
                      ).map((l) => (
                        <tr key={l.id}>
                          <td>
                            <b>{l.name}</b>
                            <small>{l.email}</small>
                          </td>
                          <td>
                            {l.kind}
                            <small>{l.date || l.reference}</small>
                          </td>
                          <td>
                            {new Date(l.created_at).toLocaleDateString(
                              "en-PK",
                              { timeZone: "Asia/Karachi" },
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                "status-badge " + l.status.toLowerCase()
                              }
                            >
                              {l.status}
                            </span>
                          </td>
                          <td>{l.assigned || "Unassigned"}</td>
                          <td>
                            <button onClick={() => setLead(l)}>
                              Open <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <AdminEmpty
                  icon={section === "Leads" ? Users : CalendarDays}
                  title={
                    section === "Leads"
                      ? "Every relationship starts with hello."
                      : "A little space in your calendar."
                  }
                  text={
                    section === "Leads"
                      ? "Website inquiries will appear here. Try adjusting your filters if you’re searching for a request."
                      : "Consultation and property viewing requests appear here when submitted."
                  }
                />
              )}
            </section>
          )}
          {section === "Content" && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <h3>Your editorial collection</h3>
                <span>{content.length} entries</span>
              </div>
              {content.length ? (
                <div className="admin-content-list">
                  {content.map((c) => (
                    <div key={c.id}>
                      <FileText size={22} />
                      <span>
                        <small>
                          {c.type.toUpperCase()} ·{" "}
                          {c.published ? "PUBLISHED" : "DRAFT"}
                        </small>
                        <h3>{c.title}</h3>
                      </span>
                      <button
                        className="text-link"
                        onClick={() => setEditing({ kind: "content", data: c })}
                      >
                        Edit <ArrowUpRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmpty
                  icon={FileText}
                  title="Make your expertise part of the story."
                  text="Create journal articles, verified projects, FAQs or approved testimonials. Publish only content you can substantiate."
                />
              )}
            </section>
          )}
          {section === "Media" && (
            <section className="admin-panel">
              <div className="admin-panel-title">
                <h3>Your visual collection</h3>
                <label className="upload-button">
                  <Upload size={16} /> Upload media
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,.glb"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const fd = new FormData();
                        fd.append("file", f);
                        action(
                          () => api("media", "POST", fd),
                          "Media uploaded.",
                        );
                      }
                    }}
                  />
                </label>
              </div>
              {media.length ? (
                <div className="admin-media-grid">
                  {media.map((m) => (
                    <div key={m.id}>
                      {m.mime?.startsWith("video/") ? (
                        <video src={m.url} controls preload="metadata" />
                      ) : m.mime === "model/gltf-binary" ? (
                        <div className="model-file-preview">
                          <Building2 size={34} />
                          <span>3D ARCHITECTURAL MODEL</span>
                          <small>GLB 2.0</small>
                        </div>
                      ) : (
                        <img src={m.url} alt={m.name} loading="lazy" />
                      )}
                      <p>{m.name}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            location.origin + m.url,
                          );
                          setMessage("Image URL copied.");
                        }}
                      >
                        Copy URL
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <AdminEmpty
                  icon={Image}
                  title="A place for your visual identity."
                  text="Upload original photographs and 360° images (PNG/JPG/WebP, up to 8 MB), property videos or self-contained GLB models (up to 16 MB)."
                />
              )}
            </section>
          )}
          {section === "Settings" && (
            <>
              <section className="admin-panel admin-settings">
                <h3>Company & contact details</h3>
                <p>
                  Both official company numbers are active. Updates here apply
                  across contact pages, the footer, property inquiries and the
                  floating contact panel.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = Object.fromEntries(
                      new FormData(e.currentTarget),
                    );
                    action(() => api("settings", "PUT", data));
                  }}
                >
                  <div className="form-row">
                    <FormField label="Company name">
                      <input value="M. Star Associates" readOnly />
                    </FormField>
                    <FormField label="Phone number">
                      <input
                        name="phone"
                        defaultValue={settings.phone || "+92 311 2824467"}
                        required
                        type="tel"
                        placeholder="+92…"
                      />
                    </FormField>
                    <FormField label="WhatsApp (country code + digits)">
                      <input
                        name="whatsapp"
                        defaultValue={settings.whatsapp || "923112824467"}
                        required
                        pattern="[0-9]{10,15}"
                        placeholder="923001234567"
                      />
                    </FormField>
                    <FormField label="Phone number 2 (international)">
                      <input
                        name="phone2"
                        defaultValue={settings.phone2 || "+92 335 5818818"}
                        type="tel"
                        required
                      />
                    </FormField>
                    <FormField label="WhatsApp 2 (country code + digits)">
                      <input
                        name="whatsapp2"
                        defaultValue={settings.whatsapp2 || "923355818818"}
                        required
                        pattern="[0-9]{10,15}"
                      />
                    </FormField>
                    <FormField label="Email">
                      <input
                        name="email"
                        defaultValue={settings.email || ""}
                        type="email"
                      />
                    </FormField>
                    <FormField label="SEO description">
                      <textarea
                        name="description"
                        defaultValue={settings.description || ""}
                        maxLength={300}
                      />
                    </FormField>
                    {[
                      [
                        "facebook",
                        "Facebook",
                        "https://www.facebook.com/profile.php?id=61596531896362",
                      ],
                      ["instagram", "Instagram", "https://www.instagram.com/mstarassociates/"],
                      ["youtube", "YouTube", "https://www.youtube.com/@mstar-associates"],
                      ["tiktok", "TikTok (not yet created)", ""],
                    ].map(([key, label, fallback]) => (
                      <FormField key={key} label={label}>
                        <input
                          name={key}
                          type="url"
                          defaultValue={settings[key] || fallback}
                          placeholder={
                            key === "facebook"
                              ? "Official Facebook page"
                              : "Leave empty to display Coming Soon"
                          }
                        />
                      </FormField>
                    ))}
                  </div>
                  <button className="button navy" disabled={busy}>
                    Save Settings <CheckCircle2 size={16} />
                  </button>
                </form>
              </section>
              <section className="admin-panel admin-settings">
                <h3>The original. Beautifully preserved.</h3>
                <p>
                  Upload the supplied official M. Star Associates logo. Its
                  bytes, proportions and colors are preserved, and the same
                  artwork appears in navigation, footer, loading, favicon and
                  this dashboard.
                </p>
                <div className="brand-upload-preview">
                  {brand}
                  <label className="upload-button">
                    <Upload size={16} /> Upload Original Logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const fd = new FormData();
                          fd.append("file", f);
                          action(
                            () => api("brand", "POST", fd),
                            "Original logo saved. Refresh the website to see the updated artwork.",
                          );
                        }
                      }}
                    />
                  </label>
                </div>
              </section>
              {me.role === "owner" && (
                <section className="admin-panel admin-settings">
                  <h3>Authorized team</h3>
                  <p>
                    Only approved user IDs can access administrative records. A
                    signed-in user’s Site ID is shown in the access-denied
                    message.
                  </p>
                  <div className="admin-users">
                    {users.map((u) => (
                      <div key={u.user_id}>
                        <span>
                          <b>{u.name || u.email || u.user_id}</b>
                          <small>{u.user_id}</small>
                        </span>
                        <span className="status-badge">{u.role}</span>
                        {u.role !== "owner" && (
                          <button
                            onClick={() =>
                              setEditing({ kind: "revoke", data: u })
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = Object.fromEntries(
                        new FormData(e.currentTarget),
                      );
                      action(
                        () => api("users", "POST", data),
                        "Team access saved.",
                      );
                    }}
                  >
                    <div className="form-row">
                      <FormField label="Site user ID">
                        <input name="user_id" required minLength={3} />
                      </FormField>
                      <FormField label="Display name">
                        <input name="name" required />
                      </FormField>
                      <FormField label="Role">
                        <select name="role">
                          <option value="editor">Editor</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
                      </FormField>
                    </div>
                    <button className="button navy" disabled={busy}>
                      Authorize Team Member <Plus size={16} />
                    </button>
                  </form>
                </section>
              )}
            </>
          )}
        </main>
        <footer className="admin-footer">
          M. STAR ASSOCIATES{" "}
          <span>Thoughtfully managed. Securely connected.</span>
        </footer>
      </div>
      {editing && (
        <Modal
          title={
            editing.kind === "property"
              ? "Curate your property."
              : editing.kind === "content"
                ? "Shape your story."
                : "Please review this change."
          }
          close={() => setEditing(null)}
        >
          {editing.kind === "property" ? (
            <form
              className="admin-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const data: any = Object.fromEntries(fd);
                for (const k of ["price", "beds", "baths", "sqyd"])
                  data[k] = Number(data[k]);
                for (const k of ["featured", "furnished", "published"])
                  data[k] = fd.get(k) === "on";
                data.id = editing.data.id;
                data.gallery = String(data.gallery || "")
                  .split(/\n/)
                  .map((s) => s.trim())
                  .filter(Boolean);
                data.amenities = String(data.amenities || "")
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean);
                action(
                  () => api("properties", "PUT", data),
                  "Property saved.",
                ).then((ok) => {
                  if (ok) setEditing(null);
                });
              }}
            >
              <div className="form-row">
                {[
                  ["Title", "title"],
                  ["Area / neighbourhood", "area"],
                  ["Price (PKR)", "price"],
                  ["Bedrooms", "beds"],
                  ["Bathrooms", "baths"],
                  ["Plot / property area (sq. yd.)", "sqyd"],
                ].map(([l, n]) => (
                  <FormField key={n} label={l + " *"}>
                    <input
                      name={n}
                      defaultValue={editing.data[n]}
                      required
                      type={
                        ["price", "beds", "baths", "sqyd"].includes(n)
                          ? "number"
                          : "text"
                      }
                      min="0"
                    />
                  </FormField>
                ))}
                <FormField label="Type">
                  <select name="type" defaultValue={editing.data.type}>
                    {["House", "Apartment", "Plot", "Office"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Purpose">
                  <select name="purpose" defaultValue={editing.data.purpose}>
                    <option>Buy</option>
                    <option>Rent</option>
                  </select>
                </FormField>
                <FormField label="Construction status">
                  <select name="status" defaultValue={editing.data.status}>
                    {["Draft", "Ready", "Under construction", "Plot"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </FormField>
                <FormField label="Image URL (upload in Media first)">
                  <input
                    name="image"
                    defaultValue={editing.data.image}
                    required
                    placeholder="/api/media/…"
                  />
                </FormField>
              </div>
              <div className="admin-media-editor">
                <h3>Immersive property media</h3>
                <p>
                  Upload genuine assets in Media, then paste their URLs here.
                  Experiences appear only when assets are configured.
                </p>
                <FormField label="Additional photographs (one image URL per line)">
                  <textarea
                    name="gallery"
                    defaultValue={(editing.data.gallery || []).join("\n")}
                    rows={3}
                    placeholder="/api/media/…"
                  />
                </FormField>
                <div className="form-row">
                  <FormField label="360° equirectangular panorama (2:1 image)">
                    <input
                      name="panorama"
                      defaultValue={editing.data.panorama || ""}
                      placeholder="Original panoramic image URL"
                    />
                  </FormField>
                  <FormField label="Property model (self-contained GLB 2.0)">
                    <input
                      name="model"
                      defaultValue={editing.data.model || ""}
                      placeholder="/api/media/…"
                    />
                  </FormField>
                  <FormField label="Property video (MP4 or WebM)">
                    <input
                      name="video"
                      defaultValue={editing.data.video || ""}
                      placeholder="/api/media/… or https://…"
                    />
                  </FormField>
                </div>
                <small>
                  Only use authorized property assets. The homepage villa is a
                  separate original architectural concept.
                </small>
              </div>
              <FormField label="Description *">
                <textarea
                  name="description"
                  defaultValue={editing.data.description}
                  required
                  minLength={20}
                  rows={4}
                />
              </FormField>
              <FormField label="Amenities, separated by commas">
                <input
                  name="amenities"
                  defaultValue={editing.data.amenities.join(", ")}
                />
              </FormField>
              <div className="admin-checkboxes">
                {[
                  ["Featured", "featured"],
                  ["Furnished", "furnished"],
                  ["Publish listing", "published"],
                ].map(([l, n]) => (
                  <label key={n}>
                    <input
                      type="checkbox"
                      name={n}
                      defaultChecked={editing.data[n]}
                    />
                    {l}
                  </label>
                ))}
              </div>
              <p className="sample-note">
                Only publish authorized, verified listings. Do not upload
                sensitive ownership documents.
              </p>
              <button className="button navy" disabled={busy}>
                Save Property <CheckCircle2 size={16} />
              </button>
            </form>
          ) : editing.kind === "content" ? (
            <form
              className="admin-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                action(() =>
                  api("content", "PUT", {
                    ...Object.fromEntries(fd),
                    id: editing.data.id,
                    published: fd.get("published") === "on",
                  }),
                ).then((ok) => {
                  if (ok) setEditing(null);
                });
              }}
            >
              <div className="form-row">
                <FormField label="Content type">
                  <select name="type" defaultValue={editing.data.type}>
                    {[
                      "blog",
                      "project",
                      "faq",
                      "service",
                      "homepage",
                      "banner",
                      "testimonial",
                      "offer",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Title">
                  <input
                    name="title"
                    defaultValue={editing.data.title}
                    required
                  />
                </FormField>
                <FormField label="URL slug">
                  <input
                    name="slug"
                    defaultValue={editing.data.slug}
                    pattern="[a-z0-9-]+"
                    required
                  />
                </FormField>
                <FormField label="Offer destination (same-site path, optional)">
                  <input
                    name="link"
                    defaultValue={editing.data.link || ""}
                    placeholder="/properties or /consultation"
                  />
                </FormField>
                <FormField label="Image URL (optional)">
                  <input name="image" defaultValue={editing.data.image} />
                </FormField>
              </div>
              <FormField label="Body / answer">
                <textarea
                  name="body"
                  defaultValue={editing.data.body}
                  required
                  rows={8}
                />
              </FormField>
              <label className="admin-check">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={editing.data.published}
                />
                Publish this content
              </label>
              <label className="admin-check">
                <input type="checkbox" required />I confirm the content is
                accurate and any testimonial or project claim is authorized and
                verified.
              </label>
              <button className="button navy" disabled={busy}>
                Save Content <CheckCircle2 size={16} />
              </button>
            </form>
          ) : (
            <div>
              <p>
                {editing.kind === "archive"
                  ? `Archive “${editing.data.title}”? It will be removed from public listings and retained in your inventory.`
                  : `Remove access for ${editing.data.name || editing.data.user_id}? Their administrative access will end.`}
              </p>
              <div className="admin-confirm">
                <button
                  className="button outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button
                  className="button navy"
                  disabled={busy}
                  onClick={() =>
                    action(() =>
                      editing.kind === "archive"
                        ? api("properties", "PATCH", { id: editing.data.id })
                        : api("users", "DELETE", {
                            user_id: editing.data.user_id,
                          }),
                    ).then((ok) => {
                      if (ok) setEditing(null);
                    })
                  }
                >
                  Confirm Change
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
      {lead && (
        <Modal title={"Inquiry " + lead.reference} close={() => setLead(null)}>
          <div className="lead-contact">
            <h3>{lead.name}</h3>
            <a href={"mailto:" + lead.email}>{lead.email}</a>
            <a href={"tel:" + lead.phone}>{lead.phone}</a>
          </div>
          <div className="notice">
            <b>{lead.kind}</b>
            <p>{lead.message}</p>
            {lead.property && <p>Property: {lead.property}</p>}
            {lead.date && <p>Preferred date: {lead.date}</p>}
            {lead.location && (
              <p>
                {lead.location} · {lead.propertyType} · {lead.area} {lead.unit}
              </p>
            )}
          </div>
          <form
            className="admin-edit-form"
            onSubmit={(e) => {
              e.preventDefault();
              action(() =>
                api("leads", "PATCH", {
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                  id: lead.id,
                }),
              ).then((ok) => {
                if (ok) setLead(null);
              });
            }}
          >
            <div className="form-row">
              <FormField label="Status">
                <select name="status" defaultValue={lead.status}>
                  {[
                    "New",
                    "Contacted",
                    "Qualified",
                    "Scheduled",
                    "Closed",
                    "Archived",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Assigned to">
                <select name="assigned" defaultValue={lead.assigned || ""}>
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name || u.email || u.user_id}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Follow-up date">
                <input
                  name="followUp"
                  type="date"
                  defaultValue={lead.followUp || ""}
                />
              </FormField>
            </div>
            <FormField label="Team notes">
              <textarea name="notes" rows={5} defaultValue={lead.notes || ""} />
            </FormField>
            <button className="button navy" disabled={busy}>
              Save Request <CheckCircle2 size={16} />
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function ChartIcon(props: any) {
  return <LayoutDashboard {...props} />;
}
function AdminEmpty({ icon: I, title, text }: any) {
  return (
    <div className="admin-empty">
      <I size={34} strokeWidth={1} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
