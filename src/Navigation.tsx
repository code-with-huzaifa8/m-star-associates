import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  KeyRound,
  Building2,
  HardHat,
  Layers,
  PaintRoller,
  ShieldCheck,
  Compass,
  CalendarDays,
  Heart,
  MapPin,
  X,
} from "lucide-react";
import gsap from "gsap";
import { createPortal } from "react-dom";
type Props = {
  path: string;
  mobileOpen: boolean;
  closeMobile: () => void;
  favoriteCount: number;
  offers: any[];
  listings: any[];
  onNavigate: (url: string) => void;
};
const realEstate = [
  [
    "Property Sale",
    "Position your property with confidence.",
    "/sell-property",
    Building2,
  ],
  [
    "Property Purchase",
    "Find a space that feels like yours.",
    "/buy-property",
    KeyRound,
  ],
  [
    "Property Rentals",
    "Room for the way you live and work.",
    "/rent-property",
    KeyRound,
  ],
  [
    "Property Management",
    "Thoughtful care, beyond the transaction.",
    "/property-management",
    ShieldCheck,
  ],
];
const construction = [
  [
    "Construction Services",
    "From a clear brief to a considered build.",
    "/construction",
    "/assets/construction.jpg",
    HardHat,
  ],
  [
    "Real Estate Development",
    "See potential. Shape what comes next.",
    "/development",
    "/assets/architecture.jpg",
    Layers,
  ],
  [
    "Property Renovation",
    "A new perspective on familiar spaces.",
    "/renovation",
    "/assets/interior.jpg",
    PaintRoller,
  ],
];
const discovery = [
  [
    "Featured Properties",
    "A considered starting point.",
    "/properties?sort=featured",
    Building2,
  ],
  [
    "Latest Listings",
    "Explore the property collection.",
    "/properties?sort=newest",
    Compass,
  ],
  [
    "Investment Opportunities",
    "Perspective before commitment.",
    "/investment",
    Layers,
  ],
  [
    "Rental Opportunities",
    "Discover your next address.",
    "/rent-property",
    KeyRound,
  ],
  [
    "Construction Consultations",
    "Bring your vision into focus.",
    "/construction-quotation",
    CalendarDays,
  ],
];
export default function Navigation({
  path,
  mobileOpen,
  closeMobile,
  favoriteCount,
  offers,
  listings,
  onNavigate,
}: Props) {
  const [open, setOpen] = useState("");
  const [rendered, setRendered] = useState("");
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const transition = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    setOpen("");
    closeMobile();
  }, [path]);
  useEffect(() => {
    transition.current?.kill();
    if (open) {
      setRendered(open);
    } else if (panel.current) {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches)
        setRendered("");
      else
        transition.current = gsap
          .timeline({ onComplete: () => setRendered("") })
          .to(panel.current, {
            opacity: 0,
            y: -8,
            scale: 0.99,
            duration: 0.17,
            ease: "power2.in",
          });
    }
    return () => {
      transition.current?.kill();
    };
  }, [open]);
  useEffect(() => {
    if (!rendered || !open || !panel.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(panel.current, { opacity: 1, y: 0, scale: 1 });
      return;
    }
    const context = gsap.context(() => {
      gsap.fromTo(
        panel.current,
        { opacity: 0, y: -12, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.34, ease: "power3.out" },
      );
      gsap.fromTo(
        panel.current!.querySelectorAll("[data-menu-item]"),
        { opacity: 0, y: 9 },
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          stagger: 0.035,
          delay: 0.06,
          ease: "power2.out",
        },
      );
    }, panel);
    return () => context.revert();
  }, [rendered, open]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen("");
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen("");
        triggers.current[open]?.focus();
      }
      if (e.key === "Tab" && panel.current && !mobileOpen) {
        const elements =
          panel.current.querySelectorAll<HTMLElement>("a[href],button");
        const last = elements[elements.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          setOpen("");
        }
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open, mobileOpen]);
  useEffect(() => {
    if (!mobileOpen) setOpen("");
  }, [mobileOpen]);
  useEffect(() => {
    const query = matchMedia("(max-width:1100px)");
    const resize = () => {
      setOpen("");
      closeMobile();
    };
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  const follow = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setOpen("");
    closeMobile();
    onNavigate(url);
  };
  const A = ({ to, children, ...props }: any) => (
    <a href={to} onClick={(e) => follow(e, to)} {...props}>
      {children}
    </a>
  );
  const toggle = (name: string) => setOpen(open === name ? "" : name);
  const trigger = (name: string, label: string) => (
    <button
      ref={(el) => {
        triggers.current[name] = el;
      }}
      type="button"
      className={"mega-trigger " + (open === name ? "selected" : "")}
      aria-expanded={open === name}
      aria-controls={"mega-" + name}
      onClick={() => toggle(name)}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(name);
          setTimeout(
            () => panel.current?.querySelector<HTMLElement>("a[href]")?.focus(),
            70,
          );
        }
      }}
    >
      {label}
      <ChevronDown size={12} />
    </button>
  );
  const item = (entry: any, i: number) => {
    const [title, text, to, I] = entry;
    return (
      <A to={to} key={title} className="mega-service-item" data-menu-item>
        <span className="mega-item-icon">
          <I size={19} strokeWidth={1.35} />
        </span>
        <span>
          <b>{title}</b>
          <small>{text}</small>
        </span>
        <ArrowUpRight size={14} />
      </A>
    );
  };
  const content = (name: string) => (
    <div className={"mega-content " + name}>
      {name === "properties" ? (
        <>
          <div className="mega-column">
            <span className="mega-kicker">YOUR NEXT ADDRESS</span>
            {[
              [
                "Explore All Properties",
                "Discover the complete collection.",
                "/properties",
                Building2,
              ],
              [
                "Buy a Property",
                "A place to make your own.",
                "/buy-property",
                KeyRound,
              ],
              [
                "Rent a Property",
                "Space for your next chapter.",
                "/rent-property",
                KeyRound,
              ],
              [
                "Your Saved Properties",
                `${favoriteCount} saved on this device.`,
                "/favorites",
                Heart,
              ],
            ].map(item)}
          </div>
          <div className="mega-column">
            <span className="mega-kicker">A MORE PERSONAL SEARCH</span>
            <A
              to="/requirements"
              className="mega-feature compact-feature"
              data-menu-item
            >
              <Compass size={30} />
              <h3>
                Tell us what
                <br />
                <em>home means to you.</em>
              </h3>
              <p>Your area, your budget, your priorities.</p>
              <span>
                Share Your Requirements
                <ArrowUpRight size={15} />
              </span>
            </A>
            <A to="/valuation" className="mega-bottom-link" data-menu-item>
              Request a Property Valuation
              <ArrowUpRight size={16} />
            </A>
          </div>
          <ExperienceCard A={A} />
        </>
      ) : name === "services" ? (
        <>
          <div className="mega-column">
            <span className="mega-kicker">REAL ESTATE SERVICES</span>
            {realEstate.map(item)}
          </div>
          <div className="mega-column">
            <span className="mega-kicker">CONSTRUCTION & DEVELOPMENT</span>
            {construction.map(([title, text, to, image, I]: any) => (
              <A
                to={to}
                className="mega-construction-item"
                key={title}
                data-menu-item
              >
                <img src={image} alt="" />
                <span>
                  <b>{title}</b>
                  <small>{text}</small>
                </span>
                <ArrowUpRight size={14} />
              </A>
            ))}
            <A
              to="/construction-quotation"
              className="mega-bottom-link"
              data-menu-item
            >
              Discuss Your Project
              <ArrowUpRight size={16} />
            </A>
          </div>
          <ExperienceCard A={A} />
        </>
      ) : (
        <>
          <div className="mega-column">
            <span className="mega-kicker">DISCOVER WHAT COMES NEXT</span>
            {discovery.map(item)}
          </div>
          <div className="mega-column">
            <span className="mega-kicker">
              {offers.length ? "CURRENT HIGHLIGHTS" : "THE PROPERTY EDIT"}
            </span>
            {offers.length ? (
              offers.slice(0, 2).map((o) => (
                <A
                  to={o.link || "/properties"}
                  className="mega-offer-card"
                  key={o.id}
                  data-menu-item
                >
                  {o.image && <img src={o.image} alt={o.title} />}
                  <small>COMPANY HIGHLIGHT</small>
                  <h3>{o.title}</h3>
                  <p>{o.body}</p>
                  <span>
                    Explore More
                    <ArrowUpRight size={15} />
                  </span>
                </A>
              ))
            ) : (
              <>
                <A to="/properties" className="mega-offer-card" data-menu-item>
                  <img
                    src="/assets/villa.jpg"
                    alt="Architectural inspiration"
                  />
                  <small>ARCHITECTURAL INSPIRATION</small>
                  <h3>
                    A glimpse of
                    <br />
                    <em>the possibilities.</em>
                  </h3>
                  <p>
                    Explore clearly labeled sample spaces and share what you’re
                    looking for.
                  </p>
                  <span>
                    Explore the Collection
                    <ArrowUpRight size={15} />
                  </span>
                </A>
                <p className="mega-honesty" data-menu-item>
                  Discovery categories, without invented discounts, availability
                  or promotional prices.
                </p>
              </>
            )}
          </div>
          <div className="mega-column">
            <span className="mega-kicker">LET’S MAKE IT PERSONAL</span>
            <A
              to="/consultation"
              className="mega-feature consultation-feature"
              data-menu-item
            >
              <span className="mega-feature-index">THE M. STAR APPROACH</span>
              <h3>
                Possibilities start
                <br />
                with a <em>conversation.</em>
              </h3>
              <p>
                Talk through your requirements with a property partner in
                Karachi.
              </p>
              <span>
                Book a Private Consultation
                <ArrowUpRight size={15} />
              </span>
            </A>
            <A to="/contact" className="mega-bottom-link" data-menu-item>
              <MapPin size={14} />
              DHA Phase 6, Karachi
              <ArrowUpRight size={14} />
            </A>
          </div>
        </>
      )}
    </div>
  );
  return (
    <>
      <nav
        ref={root}
        className={
          mobileOpen ? "nav premium-navigation open" : "nav premium-navigation"
        }
        aria-label="Main navigation"
      >
        <A to="/" className={path === "/" ? "active" : ""}>
          Home
        </A>
        {[
          ["properties", "Properties"],
          ["services", "Our Services"],
          ["offers", "Offers"],
        ].map(([name, label]) => (
          <div className="mega-nav-group" key={name}>
            {trigger(name, label)}
            {mobileOpen && open === name && (
              <div className="mega-mobile-content" id={"mega-" + name}>
                {content(name)}
              </div>
            )}
          </div>
        ))}
        <A to="/projects">Projects</A>
        <A to="/about">About Us</A>
        <A to="/contact">Contact</A>
        {rendered && !mobileOpen && (
          <div
            ref={panel}
            className="mega-panel"
            id={"mega-" + rendered}
            role="region"
            aria-label={
              rendered === "services"
                ? "Our Services"
                : rendered === "offers"
                  ? "Offers and property discovery"
                  : "Property discovery"
            }
            aria-hidden={!open}
            inert={!open}
          >
            <div className="mega-panel-top">
              <span>
                M. STAR ASSOCIATES <i /> YOUR TRUSTED PARTNER IN REAL ESTATE
              </span>
              <button
                onClick={() => {
                  setOpen("");
                  triggers.current[rendered]?.focus();
                }}
                aria-label="Close navigation panel"
              >
                <X size={16} />
              </button>
            </div>
            {content(rendered)}
            <div className="mega-panel-footer">
              <span>REAL ESTATE · CONSTRUCTION · DEVELOPMENT</span>
              <A to="/contact">
                A direct line to your next chapter
                <ArrowUpRight size={13} />
              </A>
            </div>
          </div>
        )}
      </nav>
      {open &&
        !mobileOpen &&
        createPortal(
          <div
            className="mega-backdrop"
            aria-hidden="true"
            onClick={() => setOpen("")}
          />,
          document.body,
        )}
    </>
  );
}
function ExperienceCard({ A }: any) {
  return (
    <div className="mega-column experience-column">
      <span className="mega-kicker">A DISTINCTIVE PERSPECTIVE</span>
      <A
        to="/services"
        className="mega-feature experience-feature"
        data-menu-item
      >
        <img
          src="/assets/architecture.jpg"
          alt="Contemporary architectural inspiration"
        />
        <div />
        <span className="mega-feature-copy">
          <small>ONE PARTNER. EVERY POSSIBILITY.</small>
          <h3>
            Discover the
            <br />
            <em>M. Star Experience.</em>
          </h3>
          <span>
            Explore All Services
            <ArrowUpRight size={16} />
          </span>
        </span>
      </A>
      <span className="mega-feature-caption" data-menu-item>
        A thoughtful approach to every chapter.
      </span>
    </div>
  );
}
