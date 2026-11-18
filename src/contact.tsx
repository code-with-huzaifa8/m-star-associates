import { useEffect, useRef, useState } from "react";
import {
  Facebook,
  Instagram,
  Youtube,
  Phone,
  MessageCircle,
  ArrowUpRight,
  X,
  ChevronDown,
  Send,
} from "lucide-react";
export const defaultContacts = {
  phone: "+92 311 2824467",
  phone2: "+92 335 5818818",
  whatsapp: "923112824467",
  whatsapp2: "923355818818",
  facebook: "https://www.facebook.com/profile.php?id=61596531896362",
  instagram: "https://www.instagram.com/mstarassociates/",
  youtube: "https://www.youtube.com/@mstar-associates",
  tiktok: "",
};
export const contactConfig = (config: any) => ({
  ...defaultContacts,
  ...config,
  // Keep the public links active even if an older API config contains empty values.
  instagram: config?.instagram || defaultContacts.instagram,
  youtube: config?.youtube || defaultContacts.youtube,
});
export const digits = (s: string) => String(s).replace(/\D/g, "");
function TikTok({ size = 18 }: any) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3v12.2a4.6 4.6 0 1 1-4.5-4.6h.7v3.2a1.6 1.6 0 1 0 1 1.5V3h2.8Zm0 0c.6 3 2.5 4.8 5.5 5v3.1A9.6 9.6 0 0 1 14 9" />
    </svg>
  );
}
export function SocialLinks({ config, compact = false }: any) {
  const c = contactConfig(config);
  return (
    <div
      className={"social-links " + (compact ? "compact" : "")}
      aria-label="Official social channels"
    >
      {[
        ["facebook", "Facebook", Facebook],
        ["instagram", "Instagram", Instagram],
        ["youtube", "YouTube", Youtube],
        ["tiktok", "TikTok", TikTok],
      ].map(([key, label, I]: any) =>
        c[key] ? (
          <a
            key={key}
            href={c[key]}
            aria-label={"M. Star Associates on " + label}
            title={label}
            target="_blank"
            rel="noopener noreferrer"
          >
            <I size={17} />
            {!compact && <span>{label}</span>}
            <ArrowUpRight size={11} />
          </a>
        ) : (
          <span
            className="social-disabled"
            key={key}
            aria-label={label + " — coming soon"}
            title={label + " — coming soon"}
          >
            <I size={17} />
            {!compact && <span>{label}</span>}
            <small>SOON</small>
          </span>
        ),
      )}
    </div>
  );
}
export function ContactNumbers({
  config,
  whatsapp = true,
  compact = false,
}: any) {
  const c = contactConfig(config);
  return (
    <div className={"official-numbers " + (compact ? "compact" : "")}>
      {[1, 2].map((i) => {
        const phone = c[i === 1 ? "phone" : "phone2"];
        const wa = c[i === 1 ? "whatsapp" : "whatsapp2"];
        return (
          <div key={i}>
            <a className="official-call" href={"tel:+" + digits(phone)}>
              <Phone size={14} />
              <span>{phone}</span>
            </a>
            {whatsapp && wa && (
              <a
                className="official-whatsapp"
                href={"https://wa.me/" + digits(wa)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={"WhatsApp " + phone}
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
                <ArrowUpRight size={11} />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
export function ContactWidget({ config }: any) {
  const [open, setOpen] = useState(false);
  const c = contactConfig(config);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current
          ?.querySelector<HTMLButtonElement>(".contact-launcher")
          ?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div className="contact-widget" ref={ref}>
      {open && (
        <div className="contact-mini-panel" id="contact-options">
          <div className="contact-mini-heading">
            <span className="live-dot" />
            <span>YOUR NEXT CHAPTER</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close contact options"
            >
              <X size={15} />
            </button>
          </div>
          <h3>
            Let’s <em>connect.</em>
          </h3>
          <p>A direct line to your property partner.</p>
          {[1, 2].map((i) => (
            <a
              className="mini-contact-link"
              key={i}
              href={
                "https://wa.me/" + digits(c[i === 1 ? "whatsapp" : "whatsapp2"])
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="mini-contact-icon">
                <MessageCircle size={18} />
              </span>
              <span>
                <small>WHATSAPP — {i === 1 ? "PRIMARY" : "ALTERNATE"}</small>
                <b>{c[i === 1 ? "phone" : "phone2"]}</b>
              </span>
              <ArrowUpRight size={15} />
            </a>
          ))}
          <div className="mini-call-row">
            <a href={"tel:+" + digits(c.phone)}>
              <Phone size={14} /> Call Company
            </a>
            <a
              href={"tel:+" + digits(c.phone2)}
              aria-label={"Call alternate number " + c.phone2}
            >
              Line 2 <ArrowUpRight size={12} />
            </a>
          </div>
          <a className="mini-inquiry" href="/contact">
            <Send size={14} />
            Send an Inquiry
            <ArrowUpRight size={14} />
          </a>
          <small className="contact-panel-note">
            Karachi, Pakistan · English / اردو / سنڌي
          </small>
        </div>
      )}
      <button
        className={"contact-launcher " + (open ? "open" : "")}
        onClick={() => setOpen(!open)}
        aria-label={
          open ? "Close contact options" : "Contact M. Star Associates"
        }
        aria-expanded={open}
        aria-controls="contact-options"
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
      </button>
    </div>
  );
}
