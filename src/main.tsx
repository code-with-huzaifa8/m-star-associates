import React, {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
} from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { CinematicMedia, CinemaPhoto, useCinematicHome } from "./CinematicHome";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Check,
  Menu,
  X,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Heart,
  Search,
  SlidersHorizontal,
  Grid2X2,
  List,
  Map,
  Plus,
  Minus,
  MoveUpRight,
  Phone,
  MessageCircle,
  Building2,
  KeyRound,
  HardHat,
  ChartNoAxesCombined,
  PaintRoller,
  ShieldCheck,
  CalendarDays,
  Compass,
  Layers,
  Scale,
  Share2,
  Download,
  Clock,
  Pause,
  Play,
  Mail,
  CheckCircle2,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import {
  properties as demoProperties,
  services,
  projects,
  articles,
  faqs,
  money,
  areaValue,
  address,
  type Property,
} from "./data";
const Admin = React.lazy(() =>
  import("./admin").then((m) => ({ default: m.Admin })),
);
import "./fonts.css";
import "./styles.css";
import "./dark.css";
import "./navigation.css";
import "./cinematic-home.css";
import Navigation from "./Navigation";
import {
  ContactWidget,
  ContactNumbers,
  SocialLinks,
  contactConfig,
} from "./contact";
const Architecture = React.lazy(() => import("./Architecture"));
const PropertyExperience = React.lazy(() => import("./PropertyExperience"));
const ContentContext = createContext<any[]>([]);
const usePublished = (type: string) =>
  useContext(ContentContext).filter((c) => c.type === type);
const navigate = (url: string) => {
  history.pushState({}, "", url);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" });
};
function Link({
  to,
  children,
  onClick,
  ...rest
}: {
  to: string;
  children: React.ReactNode;
  [k: string]: any;
}) {
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!e.metaKey && !e.ctrlKey && to.startsWith("/")) {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </a>
  );
}
export function Brand({
  light = false,
  large = false,
  horizontalOnly = false,
}: {
  light?: boolean;
  large?: boolean;
  horizontalOnly?: boolean;
}) {
  const [hasLogo, setHasLogo] = useState(true);
  const [logoSize, setLogoSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const horizontal = !!logoSize && logoSize.width / logoSize.height > 1.8;
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand-light" : ""} ${large ? "brand-large" : ""} ${horizontal ? "brand-horizontal" : ""}`}
      style={
        logoSize
          ? ({
              "--logo-retina-width": `${logoSize.width / 2}px`,
            } as React.CSSProperties)
          : undefined
      }
      aria-label="M. Star Associates home"
    >
      {hasLogo ? (
        <img
          src="/assets/logo-Photoroom.png"
          alt="M. Star Associates"
          width={logoSize?.width}
          height={logoSize?.height}
          decoding="async"
          style={
            horizontalOnly && !logoSize ? { visibility: "hidden" } : undefined
          }
          onLoad={(e) => {
            const width = e.currentTarget.naturalWidth,
              height = e.currentTarget.naturalHeight;
            if (horizontalOnly && width / height <= 1.8) {
              setHasLogo(false);
              return;
            }
            setLogoSize({ width, height });
          }}
          onError={() => setHasLogo(false)}
        />
      ) : (
        <span className="brand-fallback">M. Star Associates</span>
      )}
    </Link>
  );
}
const Icon = ({ name, size = 25 }: { name: number; size?: number }) => {
  const I = [
    KeyRound,
    Building2,
    KeyRound,
    HardHat,
    Layers,
    ShieldCheck,
    PaintRoller,
  ][name];
  return <I size={size} strokeWidth={1.25} />;
};
function App() {
  const [path, setPath] = useState(location.pathname);
  const [menu, setMenu] = useState(false);
  const [drop, setDrop] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [listings, setListings] = useState<Property[]>(demoProperties);
  const [config, setConfig] = useState<any>(contactConfig({}));
  const [published, setPublished] = useState<any[]>([]);
  const [loading, setLoading] = useState(
    !sessionStorage.getItem("mstar-visited"),
  );
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mstar-favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [compare, setCompare] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);
  useEffect(() => {
    const on = () => {
      setPath(location.pathname);
      setMenu(false);
      setDrop("");
    };
    const scroll = () => setScrolled(scrollY > 40);
    window.addEventListener("popstate", on);
    window.addEventListener("scroll", scroll, { passive: true });
    fetch("/api/properties")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.length) setListings([...d, ...demoProperties]);
      })
      .catch(() => {});
    fetch("/api/content")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setPublished(d);
      })
      .catch(() => {});
    const loadingTimer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("mstar-visited", "1");
    }, 650);
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setConfig(contactConfig(d)))
      .catch(() => {});
    return () => {
      clearTimeout(loadingTimer);
      window.removeEventListener("popstate", on);
      window.removeEventListener("scroll", scroll);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem("mstar-favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    let active = true;
    const refresh = () => {
      fetch("/api/config")
        .then((r) => r.json())
        .then((d) => {
          if (active) setConfig(contactConfig(d));
        })
        .catch(() => {});
      fetch("/api/properties")
        .then((r) => r.json())
        .then((d) => {
          if (active && Array.isArray(d))
            setListings([...d, ...demoProperties]);
        })
        .catch(() => {});
      fetch("/api/content")
        .then((r) => r.json())
        .then((d) => {
          if (active && Array.isArray(d)) setPublished(d);
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, [path]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const title =
      path === "/"
        ? "Beyond Properties. Beyond Expectations."
        : path
            .split("/")
            .filter(Boolean)
            .map((s) => s.replaceAll("-", " "))
            .join(" · ");
    document.title = `${title} | M. Star Associates`;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    setTimeout(
      () =>
        document
          .querySelectorAll(".reveal")
          .forEach((el) => observer.observe(el)),
      70,
    );
    if (
      path !== "/" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      gsap.fromTo(
        ".page-enter",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
      );
    }
    return () => observer.disconnect();
  }, [path]);
  const save = (id: string) => {
    setFavorites((old) =>
      old.includes(id) ? old.filter((i) => i !== id) : [...old, id],
    );
  };
  const compareAdd = (id: string) => {
    setCompare((old) => {
      if (old.includes(id)) return old.filter((i) => i !== id);
      if (old.length === 3) {
        setToast("Compare up to three properties at a time.");
        return old;
      }
      return [...old, id];
    });
  };
  const cardProps = { favorites, save, compare, compareAdd };
  const home = path === "/";
  const isAdmin = path.startsWith("/admin");
  if (isAdmin)
    return (
      <React.Suspense
        fallback={
          <div className="brand-loader">
            <Brand large />
            <span className="brand-loader-line" />
          </div>
        }
      >
        <Admin brand={<Brand />} properties={listings} notify={setToast} />
      </React.Suspense>
    );
  let page: React.ReactNode;
  if (home) page = <Home listings={listings} cardProps={cardProps} />;
  else if (
    ["/properties", "/buy-property", "/rent-property", "/favorites"].includes(
      path,
    )
  )
    page = (
      <Properties
        key={path + location.search}
        listings={
          path === "/favorites"
            ? listings.filter((p) => favorites.includes(p.id))
            : listings
        }
        cardProps={cardProps}
        path={path}
      />
    );
  else if (path.startsWith("/properties/")) {
    const p = listings.find((p) => p.id === path.split("/").pop());
    page = p ? (
      <PropertyDetail
        property={p}
        listings={listings}
        cardProps={cardProps}
        notify={setToast}
        config={config}
      />
    ) : (
      <NotFound />
    );
  } else if (path === "/about") page = <About />;
  else if (path === "/services") page = <ServicesPage />;
  else if (services.some((s) => "/" + s.slug === path))
    page = (
      <ServicePage service={services.find((s) => "/" + s.slug === path)!} />
    );
  else if (path === "/projects") page = <ProjectsPage />;
  else if (path.startsWith("/projects/"))
    page = <ProjectDetail slug={path.split("/").pop()!} />;
  else if (path === "/investment") page = <Investment />;
  else if (path === "/insights") page = <Insights />;
  else if (path.startsWith("/insights/"))
    page = <Article slug={path.split("/").pop()!} />;
  else if (path === "/faq") page = <FAQ />;
  else if (path === "/privacy" || path === "/terms")
    page = <Legal privacy={path === "/privacy"} />;
  else if (
    [
      "/contact",
      "/consultation",
      "/valuation",
      "/submit-property",
      "/requirements",
      "/construction-quotation",
    ].includes(path)
  )
    page = <ContactPage path={path} config={config} />;
  else page = <NotFound />;
  return (
    <ContentContext.Provider value={published}>
      {loading && (
        <div className="brand-loader" aria-label="Loading M. Star Associates">
          <Brand large />
          <span className="brand-loader-line" />
          <small>YOUR TRUSTED PARTNER IN REAL ESTATE</small>
        </div>
      )}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`header ${home && !scrolled ? "transparent" : ""}`}>
        <div className="nav-inner">
          <Brand light={home && !scrolled} horizontalOnly />
          <Navigation
            path={path}
            mobileOpen={menu}
            closeMobile={() => setMenu(false)}
            favoriteCount={favorites.length}
            offers={published.filter((c) => c.type === "offer")}
            listings={listings}
            onNavigate={navigate}
          />
          <Link to="/consultation" className="nav-cta">
            Let’s Talk <ArrowUpRight size={16} />
          </Link>
          <button
            className="menu-toggle"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close navigation" : "Open navigation"}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main" key={path} className="page-enter">
        {page}
      </main>
      <Footer config={config} />
      <ContactWidget config={config} />
      <MotionSystem />
      {compare.length > 0 && (
        <div className="compare-tray">
          <span>{compare.length} properties selected</span>
          <button className="button small" onClick={() => setCompareOpen(true)}>
            Compare <Scale size={15} />
          </button>
          <button aria-label="Clear comparison" onClick={() => setCompare([])}>
            <X size={17} />
          </button>
        </div>
      )}
      {compareOpen && (
        <Modal close={() => setCompareOpen(false)} title="A clearer comparison">
          <div className="compare-table">
            {listings
              .filter((p) => compare.includes(p.id))
              .map((p) => (
                <div key={p.id}>
                  <img src={p.image} alt={p.title} />
                  <small>{p.demo ? "SAMPLE LISTING" : p.status}</small>
                  <h3>{p.title}</h3>
                  <p>{p.area}</p>
                  <strong>PKR {money(p.price)}</strong>
                  <p>
                    {p.beds} beds · {p.baths} baths
                  </p>
                  <p>{p.sqyd} sq. yd.</p>
                  <Link
                    to={"/properties/" + p.id}
                    className="text-link"
                    onClick={() => setCompareOpen(false)}
                  >
                    View details <ArrowUpRight size={15} />
                  </Link>
                </div>
              ))}
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </ContentContext.Provider>
  );
}
function Home({ listings, cardProps }: any) {
  const homepage = usePublished("homepage")[0];
  const testimonials = usePublished("testimonial");
  const banners = usePublished("banner");
  const [purpose, setPurpose] = useState("Buy");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const filmRoot = useRef<HTMLDivElement>(null);
  const [ambiencePaused, setAmbiencePaused] = useState(false);
  const [explore3D, setExplore3D] = useState(false);
  const reducedMotion = useCinematicHome(filmRoot, ambiencePaused || explore3D);
  return (
    <div className="film-home" ref={filmRoot}>
      <div className="film-hero-runway">
        <section className="hero cinematic-hero film-hero">
          <CinematicMedia />
          <div className="hero-editorial-overlay" />
          <div className="hero-content wrap">
            <div className="hero-copy">
              {banners.map((b) => (
                <div className="brand-announcement" key={b.id}>
                  {b.title} — {b.body}
                </div>
              ))}
              <div className="eyebrow hero-eyebrow">
                <span /> M. STAR ASSOCIATES · KARACHI
              </div>
              <h1>
                {homepage ? (
                  <span className="hero-line">
                    <span>{homepage.title}</span>
                  </span>
                ) : (
                  <>
                    <span className="hero-line">
                      <span>Beyond Properties.</span>
                    </span>
                    <span className="hero-line">
                      <span>
                        Beyond <em>Expectations.</em>
                      </span>
                    </span>
                  </>
                )}
              </h1>
              <p className="hero-sub">
                {homepage?.body || (
                  <>
                    Discover exceptional properties, iconic spaces, and
                    extraordinary real estate experiences with M. Star
                    Associates.
                  </>
                )}
              </p>
              <div className="hero-actions">
                <Link to="/properties" className="button gold">
                  Explore Properties <ArrowUpRight size={18} />
                </Link>
                <Link to="/services" className="hero-secondary">
                  Experience Our Services <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
            <div className="hero-bottom">
              <span>
                KARACHI, PAKISTAN <span className="tiny-line" /> ESTABLISHED IN
                TRUST
              </span>
              <a href="#discover" className="scroll-cue">
                SCROLL TO DISCOVER <span>↓</span>
              </a>
              <span className="hero-studio-index">
                <span /> THE ARCHITECTURAL EDITION / 01
              </span>
            </div>
          </div>
          <div className="film-utility">
            {!reducedMotion && (
              <button
                className="film-motion-toggle"
                aria-label={
                  ambiencePaused
                    ? "Resume ambient motion"
                    : "Pause ambient motion"
                }
                aria-pressed={ambiencePaused}
                onClick={() => setAmbiencePaused(!ambiencePaused)}
              >
                {ambiencePaused ? <Play size={14} /> : <Pause size={14} />}
                <span>{ambiencePaused ? "Resume motion" : "Pause motion"}</span>
              </button>
            )}
            <button
              className="film-3d-launch"
              onClick={() => setExplore3D(true)}
            >
              Explore in 3D <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="film-photo-credit">
            Architectural inspiration ·{" "}
            <a
              href="https://unsplash.com/@cesarimagestate"
              target="_blank"
              rel="noreferrer"
            >
              Cesar Cid / Unsplash
            </a>
          </div>
        </section>
      </div>
      <section className="search-section wrap" aria-label="Find a property">
        <div className="search-panel">
          <div className="search-tabs">
            {["Buy", "Rent"].map((p) => (
              <button
                key={p}
                className={purpose === p ? "selected" : ""}
                onClick={() => setPurpose(p)}
              >
                {p === "Buy" ? "Buy a property" : "Rent a property"}
              </button>
            ))}
            <span>A place for your next chapter.</span>
          </div>
          <form
            className="property-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                "/properties?" +
                  new URLSearchParams({ purpose, area, type, max: price }),
              );
            }}
          >
            <label>
              <span>LOCATION</span>
              <div>
                <MapPin size={17} />
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  aria-label="Property location"
                >
                  <option value="">Explore Karachi</option>
                  {[
                    "DHA Phase 6",
                    "DHA Phase 8",
                    "Clifton",
                    "Shahrah-e-Faisal",
                  ].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
            </label>
            <label>
              <span>PROPERTY TYPE</span>
              <div>
                <Building2 size={17} />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  aria-label="Property type"
                >
                  <option value="">All property types</option>
                  {["House", "Apartment", "Plot", "Office"].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
            </label>
            <label>
              <span>PRICE RANGE</span>
              <div>
                <ChartNoAxesCombined size={17} />
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-label="Price range"
                >
                  <option value="">Select your budget</option>
                  <option value="500000">Up to PKR 5 lakh</option>
                  <option value="50000000">Up to PKR 5 crore</option>
                  <option value="100000000">Up to PKR 10 crore</option>
                  <option value="200000000">Up to PKR 20 crore</option>
                </select>
              </div>
            </label>
            <button className="button navy search-button">
              Find Your Property <Search size={17} />
            </button>
          </form>
        </div>
      </section>
      <section className="film-intro-shell">
        <div id="discover" className="intro section wrap">
          <div className="intro-visual">
            <CinemaPhoto
              name="residence"
              alt="Warmly illuminated modern architecture opening onto a reflecting pool at dusk"
              sizes="(max-width: 900px) 100vw, 55vw"
            />
            <div className="film-detail-window" aria-hidden="true">
              <CinemaPhoto name="poolside" sizes="30vw" />
            </div>
            <div className="image-caption">
              <span>SPACES WITH PURPOSE.</span>
              <span>LIVES WITH POSSIBILITY.</span>
            </div>
            <div className="intro-seal">
              A considered
              <br />
              <em>approach.</em>
              <ArrowUpRight size={24} />
            </div>
          </div>
          <div className="intro-copy">
            <Eyebrow>WELCOME TO M. STAR ASSOCIATES</Eyebrow>
            <h2>
              More than property.
              <br />A sense of <em>belonging.</em>
            </h2>
            <p>
              We believe the right property is the beginning of something
              extraordinary. A home to make your own. A place for your business
              to grow. A vision waiting to be built.
            </p>
            <p>
              From property discovery to construction and development, M. Star
              Associates brings a thoughtful, personal approach to real estate
              in Karachi.
            </p>
            <Link to="/about" className="text-link">
              Discover Our Story <ArrowUpRight size={19} />
            </Link>
            <div className="intro-bottom">
              <ShieldCheck size={29} strokeWidth={1} />
              <span>
                YOUR TRUSTED PARTNER
                <br />
                <b>IN REAL ESTATE</b>
              </span>
              <span className="signature">M. Star Associates</span>
            </div>
          </div>
        </div>
      </section>
      <section className="collection section ivory">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <Eyebrow>THE CURATED COLLECTION</Eyebrow>
              <h2>
                Distinctive spaces.
                <br />
                <em>Exceptional possibilities.</em>
              </h2>
            </div>
            <div className="heading-aside">
              <p>A glimpse of what your next chapter could look like.</p>
              <Link to="/properties" className="text-link">
                Explore All Properties <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <div className="collection-grid">
            {listings
              .filter((p: Property) => p.featured)
              .slice(0, 3)
              .map((p: Property) => (
                <PropertyCard key={p.id} property={p} {...cardProps} />
              ))}
          </div>
          <p className="sample-note">
            An illustrative collection. Sample listings are not offers of sale
            or rent.
          </p>
        </div>
      </section>
      <section className="locations section wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>FIND YOUR NEIGHBOURHOOD</Eyebrow>
            <h2>
              A city of possibilities.
              <br />
              Find <em>your corner.</em>
            </h2>
          </div>
          <p className="heading-aside">
            From established neighbourhoods to new horizons.
            <br />
            Explore Karachi, one address at a time.
          </p>
        </div>
        <div className="location-grid">
          {[
            [
              "DHA Karachi",
              "A distinguished way of life.",
              "/assets/villa.jpg",
              "DHA Phase 8",
            ],
            [
              "Clifton",
              "Coastal energy. City living.",
              "/assets/interior.jpg",
              "Clifton",
            ],
            [
              "Commercial Karachi",
              "Room for your ambition.",
              "/assets/office.jpg",
              "Shahrah-e-Faisal",
            ],
          ].map((l, i) => (
            <Link
              to={"/properties?area=" + encodeURIComponent(l[3])}
              className={"location-tile location-" + i}
              key={l[0]}
            >
              <img
                src={l[2]}
                alt={`${l[0]} architectural inspiration`}
                loading="lazy"
              />
              <div>
                <small>EXPLORE THE AREA</small>
                <h3>{l[0]}</h3>
                <p>{l[1]}</p>
              </div>
              <span className="circle-arrow">
                <ArrowUpRight size={20} />
              </span>
            </Link>
          ))}
        </div>
        <div className="category-strip">
          {["House", "Apartment", "Plot", "Office"].map((t, i) => (
            <Link to={"/properties?type=" + t} key={t}>
              <span>0{i + 1}</span>
              {t === "House"
                ? "Residences"
                : t === "Apartment"
                  ? "Apartments"
                  : t === "Plot"
                    ? "Land & Plots"
                    : "Commercial"}
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <section className="services-section section navy-bg">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <Eyebrow>A COMPLETE REAL ESTATE PARTNER</Eyebrow>
              <h2>
                Every vision.
                <br />
                <em>Expertly considered.</em>
              </h2>
            </div>
            <div className="heading-aside">
              <p>
                One trusted relationship.
                <br />A complete world of property services.
              </p>
              <Link to="/services" className="text-link light">
                Explore Our Services <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <div className="service-rows">
            {services.map((s, i) => (
              <Link
                to={"/" + s.slug}
                className="service-row"
                onPointerMove={tiltCard}
                onPointerLeave={resetTilt}
                key={s.slug}
              >
                <span className="service-index">0{i + 1}</span>
                <Icon name={i} />
                <h3>{s.name}</h3>
                <img
                  className="service-row-image"
                  src={
                    [
                      "/assets/villa.jpg",
                      "/assets/hero.jpg",
                      "/assets/interior.jpg",
                      "/assets/construction.jpg",
                      "/assets/architecture.jpg",
                      "/assets/office.jpg",
                      "/assets/garden.jpg",
                    ][i]
                  }
                  alt=""
                  loading="lazy"
                />
                <span className="service-description">
                  {
                    [
                      "Discover the right place to call your own.",
                      "Present your property with confidence.",
                      "A space for the way you live and work.",
                      "Bring your architectural vision to life.",
                      "Unlock the possibilities of tomorrow.",
                      "Thoughtful care for your property.",
                      "A fresh perspective on familiar spaces.",
                    ][i]
                  }
                </span>
                <ArrowUpRight size={23} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="construction-section">
        <CinemaPhoto
          className="film-construction-photo"
          name="poolside"
          alt="A sheltered pool terrace with warm light, natural stone and views towards the evening landscape"
        />
        <div className="construction-overlay" />
        <div className="wrap construction-copy">
          <Eyebrow>FROM VISION TO REALITY</Eyebrow>
          <h2>
            Beautifully imagined.
            <br />
            <em>Thoughtfully built.</em>
          </h2>
          <p>
            Architecture is more than what you see.
            <br />
            It’s how a space makes you feel.
          </p>
          <Link to="/construction" className="button gold">
            Explore Construction & Development <ArrowUpRight size={18} />
          </Link>
          <span className="concept-tag">
            ARCHITECTURAL INSPIRATION · CONCEPT IMAGERY
          </span>
        </div>
      </section>
      <section className="why section wrap">
        <div className="why-heading">
          <Eyebrow>THE M. STAR APPROACH</Eyebrow>
          <h2>
            Built on trust.
            <br />
            Focused on <em>you.</em>
          </h2>
          <p>
            Property decisions are personal. Our approach starts with listening
            and brings clarity to each next step.
          </p>
          <Link to="/consultation" className="text-link">
            Let’s Start a Conversation <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="why-list">
          {[
            [
              Compass,
              "Local understanding",
              "An approach grounded in Karachi and your individual property requirements.",
            ],
            [
              ShieldCheck,
              "Clarity at every step",
              "Thoughtful communication and a clear conversation about what comes next.",
            ],
            [
              Layers,
              "A complete perspective",
              "Property, construction, development and ongoing care under one roof.",
            ],
          ].map(([I, t, d]: any) => (
            <div className="why-item" key={t}>
              <I size={31} strokeWidth={1} />
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="investment-band ivory">
        <div className="wrap">
          <div>
            <Eyebrow>LOOKING AHEAD</Eyebrow>
            <h2>
              See potential.
              <br />
              <em>Make considered moves.</em>
            </h2>
          </div>
          <p>
            Explore your goals, understand the market context, and approach
            property investment with a clear perspective.
          </p>
          <Link to="/investment" className="circle-arrow">
            <ArrowUpRight size={30} />
          </Link>
        </div>
      </section>
      <section className="process section wrap">
        <div className="section-heading">
          <div>
            <Eyebrow>A SIMPLE PATH FORWARD</Eyebrow>
            <h2>
              Your next chapter,
              <br />
              <em>step by step.</em>
            </h2>
          </div>
          <Link to="/consultation" className="text-link">
            Begin Your Journey <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="process-grid">
          {[
            [
              "Let’s talk",
              "Your needs, your priorities, your vision. It all begins with a conversation.",
            ],
            [
              "Explore together",
              "Discover suitable spaces or define a plan for your property project.",
            ],
            [
              "Move with confidence",
              "Review the details and coordinate the next steps with clarity.",
            ],
            [
              "A lasting relationship",
              "From finding a property to caring for it, continue the conversation.",
            ],
          ].map(([t, d], i) => (
            <div key={t}>
              <span>0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="insights-home section ivory">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <Eyebrow>IDEAS. INSIGHT. PERSPECTIVE.</Eyebrow>
              <h2>
                The property <em>journal.</em>
              </h2>
            </div>
            <Link to="/insights" className="text-link">
              All Insights <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="insights-grid">
            {articles.slice(0, 3).map((a) => (
              <Link
                to={"/insights/" + a.slug}
                className="insight-card"
                key={a.slug}
              >
                <div className="image-zoom">
                  <img src={a.image} alt={a.title} loading="lazy" />
                </div>
                <small>
                  {a.category.toUpperCase()} <span>—</span> {a.date}
                </small>
                <h3>{a.title}</h3>
                <span className="text-link">
                  Read the Story <ArrowUpRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {testimonials.length > 0 && (
        <section className="section wrap">
          <Eyebrow>SHARED WITH PERMISSION</Eyebrow>
          <h2>
            Words that <em>matter.</em>
          </h2>
          <div className="values-grid">
            {testimonials.map((t) => (
              <blockquote key={t.id}>
                <p>“{t.body}”</p>
                <cite>{t.title}</cite>
              </blockquote>
            ))}
          </div>
        </section>
      )}
      <ConsultationCTA />
      {explore3D &&
        createPortal(
          <div className="film-3d-shell">
            <Modal title="Explore in 3D" close={() => setExplore3D(false)}>
              <React.Suspense
                fallback={
                  <div className="film-3d-loading">
                    Preparing your architectural experience…
                  </div>
                }
              >
                <Architecture embedded />
              </React.Suspense>
            </Modal>
          </div>,
          document.body,
        )}
    </div>
  );
}

function MotionSystem() {
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      !ring.current ||
      !matchMedia("(pointer: fine)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const cursor = ring.current;
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    const x = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3.out" });
    const y = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3.out" });
    let magnetic: HTMLElement | null = null;
    const reset = () => {
      if (magnetic) {
        gsap.to(magnetic, { x: 0, y: 0, duration: 0.4, ease: "power3.out" });
        magnetic = null;
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x(e.clientX);
      y(e.clientY);
      const target = e.target as HTMLElement;
      const active = target.closest(
        ".property-image a,.location-tile,.hero-actions .button,.nav-cta,.consultation-cta .button",
      );
      cursor.style.opacity = active ? "1" : "0";
      cursor.classList.toggle("active", !!active);
      const button = target.closest<HTMLElement>(
        ".hero-actions .button,.nav-cta,.consultation-cta .button",
      );
      if (button) {
        if (magnetic && magnetic !== button) reset();
        magnetic = button;
        const r = button.getBoundingClientRect();
        gsap.to(button, {
          x: Math.max(
            -5,
            Math.min(5, (e.clientX - r.left - r.width / 2) * 0.06),
          ),
          y: Math.max(
            -4,
            Math.min(4, (e.clientY - r.top - r.height / 2) * 0.08),
          ),
          duration: 0.35,
          overwrite: true,
        });
      } else reset();
    };
    const leave = () => {
      cursor.style.opacity = "0";
      reset();
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      reset();
    };
  }, []);
  return <div ref={ring} className="magnetic-cursor" aria-hidden="true" />;
}

function tiltCard(e: React.PointerEvent<HTMLElement>) {
  if (
    e.pointerType !== "mouse" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--pointer-x", `${x * 100}%`);
  el.style.setProperty("--pointer-y", `${y * 100}%`);
  el.style.setProperty("--tilt-x", `${(y - 0.5) * -3}deg`);
  el.style.setProperty("--tilt-y", `${(x - 0.5) * 4}deg`);
}
function resetTilt(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--tilt-x", "0deg");
  e.currentTarget.style.setProperty("--tilt-y", "0deg");
}

function Eyebrow({ children }: any) {
  return (
    <div className="eyebrow">
      <span />
      {children}
    </div>
  );
}
function PropertyCard({
  property: p,
  favorites,
  save,
  compare,
  compareAdd,
}: any) {
  return (
    <article
      className="property-card reveal"
      onPointerMove={tiltCard}
      onPointerLeave={resetTilt}
    >
      <div className="property-image">
        <Link to={"/properties/" + p.id}>
          <img src={p.image} alt={p.title} loading="lazy" />
        </Link>
        <div className="property-badges">
          <span>{p.purpose === "Rent" ? "FOR RENT" : "FOR SALE"}</span>
          {p.demo && <span className="sample-badge">SAMPLE</span>}
        </div>
        <button
          className={"favorite " + (favorites.includes(p.id) ? "saved" : "")}
          onClick={() => save(p.id)}
          aria-label={
            favorites.includes(p.id) ? "Unsave property" : "Save property"
          }
        >
          <Heart
            size={17}
            fill={favorites.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
        <button
          className={
            "compare-button " + (compare.includes(p.id) ? "selected" : "")
          }
          onClick={() => compareAdd(p.id)}
          aria-label="Add property to comparison"
        >
          <Scale size={16} />
        </button>
        <Link to={"/properties/" + p.id} className="property-discover">
          Discover this property <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="property-content">
        <div className="property-location">
          <MapPin size={12} />
          {p.area}, Karachi
        </div>
        <Link to={"/properties/" + p.id}>
          <h3>{p.title}</h3>
        </Link>
        <div className="property-specs">
          {p.beds > 0 && (
            <span>
              <BedDouble size={15} />
              {p.beds} Beds
            </span>
          )}
          {p.baths > 0 && (
            <span>
              <Bath size={15} />
              {p.baths} Baths
            </span>
          )}
          <span>
            <Maximize size={14} />
            {p.sqyd} sq. yd.
          </span>
        </div>
        <div className="property-price">
          <span>
            <small>PKR</small> {money(p.price)}
            {p.purpose === "Rent" && <small> / month</small>}
          </span>
          <Link to={"/properties/" + p.id} aria-label={"View " + p.title}>
            <ArrowUpRight size={21} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function Properties({ listings, cardProps, path }: any) {
  const q = new URLSearchParams(location.search);
  const [purpose, setPurpose] = useState(
    q.get("purpose") ||
      (path === "/buy-property"
        ? "Buy"
        : path === "/rent-property"
          ? "Rent"
          : ""),
  );
  const [area, setArea] = useState(q.get("area") || "");
  const [type, setType] = useState(q.get("type") || "");
  const [min, setMin] = useState("");
  const [max, setMax] = useState(q.get("max") || "");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState("sqyd");
  const [furnished, setFurnished] = useState("");
  const [status, setStatus] = useState("");
  const [amenity, setAmenity] = useState("");
  const [sort, setSort] = useState(
    q.get("sort") === "newest" ? "newest" : "featured",
  );
  const [view, setView] = useState("grid");
  const [filters, setFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = listings
    .filter(
      (p: Property) =>
        (!purpose || p.purpose === purpose) &&
        (!area || p.area === area) &&
        (!type || p.type === type) &&
        (!min || p.price >= +min) &&
        (!max || p.price <= +max) &&
        (!beds || p.beds >= +beds) &&
        (!baths || p.baths >= +baths) &&
        (!size || areaValue(p.sqyd, unit) >= +size) &&
        (!furnished || p.furnished === (furnished === "yes")) &&
        (!status || p.status === status) &&
        (!amenity || p.amenities.includes(amenity)) &&
        (!query ||
          `${p.title} ${p.area} ${p.id}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .sort((a: Property, b: Property) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "area"
            ? b.sqyd - a.sqyd
            : sort === "newest"
              ? Date.parse(b.created_at || "1970-01-01") -
                Date.parse(a.created_at || "1970-01-01")
              : Number(b.featured) - Number(a.featured),
    );
  useEffect(
    () => setPage(1),
    [
      purpose,
      area,
      type,
      min,
      max,
      beds,
      baths,
      size,
      unit,
      furnished,
      status,
      amenity,
      query,
    ],
  );
  return (
    <>
      <PageHero
        eyebrow="A PLACE FOR EVERY POSSIBILITY"
        title={
          path === "/favorites" ? (
            <>
              Your saved <em>spaces.</em>
            </>
          ) : (
            <>
              Find where
              <br />
              you <em>belong.</em>
            </>
          )
        }
        text="Explore a considered collection of homes, commercial spaces and land in Karachi."
        image="/assets/villa.jpg"
      />
      <section className="listing-section section wrap">
        <div className="listing-toolbar">
          <div className="listing-purpose">
            {["", "Buy", "Rent"].map((p) => (
              <button
                className={purpose === p ? "selected" : ""}
                key={p}
                onClick={() => setPurpose(p)}
              >
                {p || "All properties"}
              </button>
            ))}
          </div>
          <div className="listing-actions">
            <button
              className={"outline-button " + (filters ? "selected" : "")}
              onClick={() => setFilters(!filters)}
            >
              <SlidersHorizontal size={15} /> Filters
            </button>
            <div className="view-switch">
              {[
                [Grid2X2, "grid"],
                [List, "list"],
                [Map, "map"],
              ].map(([I, v]: any) => (
                <button
                  key={v}
                  className={view === v ? "selected" : ""}
                  aria-label={v + " view"}
                  onClick={() => setView(v)}
                >
                  <I size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="listing-basic">
          <label>
            <span className="sr-only">Search properties</span>
            <Search size={16} />
            <input
              placeholder="Search by name, area or reference"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Location"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="">All Karachi locations</option>
            {[...new Set(listings.map((p: Property) => p.area))].map(
              (a: any) => (
                <option key={a}>{a}</option>
              ),
            )}
          </select>
          <select
            aria-label="Property type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All property types</option>
            {["House", "Apartment", "Plot", "Office"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        {filters && (
          <div className="advanced-filters">
            <FormField label="City">
              <select>
                <option>Karachi</option>
              </select>
            </FormField>
            <FormField label="Minimum price (PKR)">
              <input
                type="number"
                min="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </FormField>
            <FormField label="Maximum price (PKR)">
              <input
                type="number"
                min="0"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </FormField>
            <FormField label="Bedrooms">
              <select value={beds} onChange={(e) => setBeds(e.target.value)}>
                <option value="">Any</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option value={n} key={n}>
                    {n}+
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Bathrooms">
              <select value={baths} onChange={(e) => setBaths(e.target.value)}>
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option value={n} key={n}>
                    {n}+
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Minimum plot / property area">
              <input
                type="number"
                min="0"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </FormField>
            <FormField label="Area unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="sqyd">Square yards</option>
                <option value="sqft">Square feet</option>
                <option value="marla">Marla</option>
                <option value="kanal">Kanal</option>
              </select>
            </FormField>
            <FormField label="Furnishing">
              <select
                value={furnished}
                onChange={(e) => setFurnished(e.target.value)}
              >
                <option value="">Any</option>
                <option value="yes">Furnished</option>
                <option value="no">Unfurnished</option>
              </select>
            </FormField>
            <FormField label="Construction status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Any</option>
                <option>Ready</option>
                <option>Under construction</option>
                <option>Plot</option>
              </select>
            </FormField>
            <FormField label="Amenity">
              <select
                value={amenity}
                onChange={(e) => setAmenity(e.target.value)}
              >
                <option value="">Any</option>
                {[
                  "Garden",
                  "Parking",
                  "Terrace",
                  "Study",
                  "Security",
                  "Elevator",
                ].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </FormField>
            <button
              className="text-link"
              onClick={() => {
                setPurpose("");
                setArea("");
                setType("");
                setMin("");
                setMax("");
                setBeds("");
                setBaths("");
                setSize("");
                setFurnished("");
                setStatus("");
                setAmenity("");
                setQuery("");
              }}
            >
              Reset all filters <X size={15} />
            </button>
            <p className="sample-note">
              1 marla = 272.25 sq. ft. · 1 kanal = 20 marla. Verify local
              conventions against property documents.
            </p>
          </div>
        )}
        <div className="results-bar">
          <span>
            {filtered.length}{" "}
            {filtered.length === 1 ? "property" : "properties"}{" "}
            {path === "/favorites" ? "saved" : "to explore"}
          </span>
          <label>
            Sort by{" "}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured first</option>
              <option value="newest">Newest published</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="area">Largest first</option>
            </select>
          </label>
        </div>
        {view === "map" ? (
          <div className="map-empty">
            <Map size={42} strokeWidth={1} />
            <h3>Location deserves precision.</h3>
            <p>
              Sample listings have no verified coordinates. Map pins will appear
              when verified property locations are published.
            </p>
            <a
              className="text-link"
              href="https://www.google.com/maps/search/?api=1&query=DHA+Karachi+Pakistan"
              target="_blank"
              rel="noreferrer"
            >
              Explore DHA, Karachi on Google Maps <ArrowUpRight size={15} />
            </a>
            <button className="button navy" onClick={() => setView("grid")}>
              Back to properties
            </button>
          </div>
        ) : filtered.length ? (
          <>
            <div
              className={
                "collection-grid listing-grid " +
                (view === "list" ? "list-layout" : "")
              }
            >
              {filtered.slice((page - 1) * 6, page * 6).map((p: Property) => (
                <PropertyCard key={p.id} property={p} {...cardProps} />
              ))}
            </div>
            {filtered.length > 6 && (
              <div className="pagination">
                {Array.from(
                  { length: Math.ceil(filtered.length / 6) },
                  (_, i) => (
                    <button
                      key={i}
                      className={page === i + 1 ? "selected" : ""}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Search size={35} />
            <h3>
              {path === "/favorites"
                ? "A collection that’s yours."
                : "A more personal search."}
            </h3>
            <p>
              {path === "/favorites"
                ? "Tap the heart on any property to save it here on this device."
                : "No properties match your filters. Adjust your search or share your requirements with our team."}
            </p>
            <Link
              to={path === "/favorites" ? "/properties" : "/requirements"}
              className="button navy"
            >
              {path === "/favorites"
                ? "Explore Properties"
                : "Share Your Requirements"}{" "}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
        <p className="sample-note">
          Sample entries, photography, pricing and specifications are
          illustrative and are not verified inventory.
        </p>
      </section>
      <ConsultationCTA />
    </>
  );
}
function PropertyDetail({
  property: p,
  listings,
  cardProps,
  notify,
  config,
}: any) {
  const [experience, setExperience] = useState<"" | "panorama" | "model">("");
  const [image, setImage] = useState(0);
  const [gallery, setGallery] = useState(false);
  const [form, setForm] = useState("");
  const [unit, setUnit] = useState("sqyd");
  const images = p.demo
    ? [p.image, "/assets/interior.jpg", "/assets/architecture.jpg"]
    : [p.image, ...(p.gallery || [])];
  return (
    <>
      <section className="detail-top wrap">
        <div className="breadcrumbs">
          <Link to="/properties">Properties</Link> / {p.area} / {p.id}
        </div>
        <div className="detail-heading">
          <div>
            <Eyebrow>
              {p.demo ? "ILLUSTRATIVE SAMPLE LISTING" : "PROPERTY COLLECTION"}
            </Eyebrow>
            <h1>{p.title}</h1>
            <p>
              <MapPin size={15} />
              {p.area}, Karachi
            </p>
          </div>
          <div className="detail-heading-price">
            <small>{p.purpose === "Rent" ? "FOR RENT" : "FOR SALE"}</small>
            <h3>PKR {money(p.price)}</h3>
            {p.purpose === "Rent" && <span>per month</span>}
          </div>
        </div>
        <div
          className={`detail-gallery ${images.length === 1 ? "single-image" : ""}`}
        >
          <button
            className="gallery-main"
            onClick={() => {
              setImage(0);
              setGallery(true);
            }}
          >
            <img src={images[0]} alt={p.title} />
          </button>
          <div>
            {images.slice(1).map((im, i) => (
              <button
                key={im}
                onClick={() => {
                  setImage(i + 1);
                  setGallery(true);
                }}
              >
                <img
                  src={im}
                  alt={`${p.demo ? "Architectural inspiration" : "Property photograph"} ${i + 1}`}
                />
              </button>
            ))}
          </div>
          <button className="gallery-open" onClick={() => setGallery(true)}>
            <Grid2X2 size={15} />{" "}
            {p.demo ? "View inspiration gallery" : "View photo gallery"}
          </button>
        </div>
        <div className="detail-actions">
          <button onClick={() => cardProps.save(p.id)}>
            <Heart
              size={17}
              fill={
                cardProps.favorites.includes(p.id) ? "currentColor" : "none"
              }
            />{" "}
            {cardProps.favorites.includes(p.id) ? "Saved" : "Save property"}
          </button>
          <button onClick={() => cardProps.compareAdd(p.id)}>
            <Scale size={17} /> Compare
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                notify("Property link copied.");
              } catch {
                notify("Copy this page’s address to share the property.");
              }
            }}
          >
            <Share2 size={17} /> Share
          </button>
        </div>
      </section>
      {(p.panorama || p.model || p.video) && (
        <section className="property-media-options wrap">
          <span>EXPERIENCE THE SPACE</span>
          {p.model && (
            <button
              className="button outline"
              onClick={() => setExperience("model")}
            >
              Explore Property Model <Building2 size={17} />
            </button>
          )}
          {p.panorama && (
            <button
              className="button outline"
              onClick={() => setExperience("panorama")}
            >
              360° Panoramic View <Compass size={17} />
            </button>
          )}
          {p.video && (
            <div className="property-video">
              <video controls preload="none" src={p.video} poster={p.image}>
                <a href={p.video}>Open property video</a>
              </video>
            </div>
          )}
        </section>
      )}
      <section className="detail-body section wrap">
        <div>
          <div className="spec-large">
            <span>
              <BedDouble />
              {p.beds}
              <small>Bedrooms</small>
            </span>
            <span>
              <Bath />
              {p.baths}
              <small>Bathrooms</small>
            </span>
            <span>
              <Maximize />
              {+areaValue(p.sqyd, unit).toFixed(2)}
              <small>
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="sqyd">Square yards</option>
                  <option value="sqft">Square feet</option>
                  <option value="marla">Marla</option>
                  <option value="kanal">Kanal</option>
                </select>
              </small>
            </span>
            <span>
              <Building2 />
              {p.type}
              <small>Property type</small>
            </span>
          </div>
          <h2>
            A closer <em>look.</em>
          </h2>
          <p>{p.description}</p>
          {p.demo && (
            <div className="notice">
              This is a sample listing. Price, location area, dimensions and
              photography are illustrative. No availability, exact location,
              floor plan or tour is represented.
            </div>
          )}
          <h3>Considered details</h3>
          <div className="amenities">
            {p.amenities.map((a: string) => (
              <span key={a}>
                <Check size={16} />
                {a}
              </span>
            ))}
          </div>
          <h3>Property information</h3>
          <dl className="property-info">
            <dt>Reference</dt>
            <dd>{p.id}</dd>
            <dt>Purpose</dt>
            <dd>{p.purpose}</dd>
            <dt>Construction status</dt>
            <dd>{p.status}</dd>
            <dt>Furnishing</dt>
            <dd>{p.furnished ? "Furnished" : "Unfurnished"}</dd>
            <dt>Area</dt>
            <dd>{p.area}, Karachi</dd>
          </dl>
          <h3>Location</h3>
          <div className="map-empty compact">
            <MapPin size={26} />
            <p>
              {p.demo
                ? "An exact map pin is not provided for sample listings."
                : "Contact the team for the verified address and viewing arrangements."}
            </p>
            <a
              href={
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(p.area + " Karachi Pakistan")
              }
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Explore the neighbourhood <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <aside className="inquiry-panel">
          <Eyebrow>LET’S FIND YOUR PLACE</Eyebrow>
          <h3>
            Curious about
            <br />
            <em>what comes next?</em>
          </h3>
          <p>
            Tell us what you’re looking for. We’ll help you take the next step.
          </p>
          <button
            className="button navy"
            onClick={() => setForm("Property inquiry")}
          >
            Request Information <ArrowUpRight size={17} />
          </button>
          <button
            className="button outline"
            onClick={() => setForm("Viewing request")}
          >
            <CalendarDays size={17} />
            Request a Viewing
          </button>
          <div className="property-direct-contact">
            <ContactNumbers config={config} compact />
          </div>
          <small>
            {p.demo
              ? "For sample listings, we’ll discuss your actual requirements."
              : "Viewings are subject to team confirmation."}
          </small>
          <hr />
          <Brand />
          <p className="contact-small">
            Your trusted partner in real estate.
            <br />
            DHA Phase 6, Karachi.
          </p>
        </aside>
      </section>
      <section className="section ivory">
        <div className="wrap">
          <Eyebrow>CONTINUE YOUR DISCOVERY</Eyebrow>
          <h2>
            More spaces.
            <br />
            <em>More possibilities.</em>
          </h2>
          <div className="collection-grid">
            {listings
              .filter((x: Property) => x.id !== p.id)
              .slice(0, 3)
              .map((x: Property) => (
                <PropertyCard key={x.id} property={x} {...cardProps} />
              ))}
          </div>
        </div>
      </section>
      {experience && (
        <Modal
          title={
            experience === "panorama"
              ? "360° Property Panorama"
              : "Interactive Property Model"
          }
          close={() => setExperience("")}
        >
          <React.Suspense
            fallback={
              <div className="experience-status">
                Preparing your experience…
              </div>
            }
          >
            <PropertyExperience
              kind={experience}
              src={experience === "panorama" ? p.panorama : p.model}
            />
          </React.Suspense>
        </Modal>
      )}
      {gallery && (
        <Modal
          title={p.demo ? "Architectural inspiration" : "Property photographs"}
          close={() => setGallery(false)}
        >
          <div className="gallery-modal">
            <img src={images[image]} alt="Selected property inspiration" />
            <div>
              <button
                aria-label="Previous image"
                onClick={() =>
                  setImage((image + images.length - 1) % images.length)
                }
              >
                <ArrowLeft />
              </button>
              <span>
                {image + 1} / {images.length} ·{" "}
                {p.demo ? "Sample imagery" : "Property gallery"}
              </span>
              <button
                aria-label="Next image"
                onClick={() => setImage((image + 1) % images.length)}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        </Modal>
      )}
      {form && (
        <Modal title={form} close={() => setForm("")}>
          <LeadForm kind={form} property={p.id} />
        </Modal>
      )}
    </>
  );
}
function PageHero({ eyebrow, title, text, image }: any) {
  return (
    <section className={"page-hero " + (image ? "with-image" : "")}>
      {image && (
        <>
          <img src={image} alt="Luxury architectural inspiration" />
          <div className="page-hero-shade" />
        </>
      )}
      <div className="wrap">
        <div className="breadcrumbs">
          <Link to="/">Home</Link> /{" "}
          {eyebrow.split(" ").slice(0, 4).join(" ").toLowerCase()}
        </div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
    </section>
  );
}
function About() {
  return (
    <>
      <PageHero
        eyebrow="OUR STORY. YOUR NEXT CHAPTER."
        title={
          <>
            A personal approach.
            <br />A lasting <em>relationship.</em>
          </>
        }
        text="M. Star Associates. Your trusted partner in real estate."
        image="/assets/architecture.jpg"
      />
      <section className="section wrap editorial-two reveal">
        <div>
          <Eyebrow>ROOTED IN KARACHI</Eyebrow>
          <h2>
            Property is personal.
            <br />
            <em>So are we.</em>
          </h2>
        </div>
        <div>
          <p className="lead">
            A property is never just an address. It’s where a new story begins.
          </p>
          <p>
            Based in Nishat Commercial, DHA Phase 6, M. Star Associates works
            across real estate, construction and development. Our services bring
            property sale, purchase, rentals, construction, development,
            management and renovation into one conversation.
          </p>
          <p>
            Whether you’re looking for your next home, exploring a commercial
            space or considering a building project, we begin with your
            priorities. Our role is to help you define the brief, explore the
            possibilities and understand the next steps.
          </p>
          <div className="languages">
            <span>ENGLISH</span>
            <span>اردو</span>
            <span>سنڌي</span>
          </div>
        </div>
      </section>
      <section className="about-photo">
        <img
          src="/assets/interior.jpg"
          alt="Light-filled contemporary living space"
          loading="lazy"
        />
        <span>THOUGHTFUL SPACES. MEANINGFUL POSSIBILITIES.</span>
      </section>
      <section className="section wrap">
        <Eyebrow>WHAT GUIDES US</Eyebrow>
        <div className="values-grid">
          {[
            [
              "A listening ear.",
              "We begin with your needs and the details that matter to you.",
            ],
            [
              "A clear perspective.",
              "We believe in understandable communication and considered choices.",
            ],
            [
              "A complete approach.",
              "Our services span the property journey, from discovery to ongoing care.",
            ],
          ].map(([t, d]) => (
            <div className="reveal" key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="OUR SERVICES"
        title={
          <>
            A world of property.
            <br />
            One trusted <em>partner.</em>
          </>
        }
        text="Seven connected services, shaped around your individual needs."
      />
      <section className="section wrap service-page-grid">
        {services.map((s, i) => (
          <Link
            to={"/" + s.slug}
            className="service-page-card reveal"
            key={s.slug}
          >
            <Icon name={i} size={32} />
            <span>0{i + 1}</span>
            <h3>{s.name}</h3>
            <p>{s.text}</p>
            <span className="text-link">
              Discover More <ArrowUpRight size={17} />
            </span>
          </Link>
        ))}
      </section>
      <ConsultationCTA />
    </>
  );
}
function ServicePage({ service: base }: any) {
  const override = usePublished("service").find((c) => c.slug === base.slug);
  const s = override
    ? { ...base, label: override.title, text: override.body }
    : base;
  const build = ["construction", "development", "renovation"].includes(s.slug);
  return (
    <>
      <PageHero
        eyebrow={s.name.toUpperCase()}
        title={
          <>
            {s.label.split(". ")[0]}
            {s.label.includes(". ") ? (
              <>
                <br />
                <em>{s.label.split(". ").slice(1).join(". ")}</em>
              </>
            ) : null}
          </>
        }
        text={s.text}
        image={build ? "/assets/construction.jpg" : "/assets/garden.jpg"}
      />
      <section className="section wrap editorial-two reveal">
        <div>
          <Eyebrow>THOUGHTFULLY, FROM THE START</Eyebrow>
          <h2>
            Your vision.
            <br />
            <em>A clear way forward.</em>
          </h2>
        </div>
        <div>
          <p className="lead">{s.text}</p>
          <p>
            {build
              ? "We’ll discuss your site, intended use, budget and desired outcome, then define an appropriate scope. Technical advice, permissions, materials and timelines must be agreed for each individual project."
              : "Tell us about the area, property type, budget and timing you have in mind. We’ll use your requirements to guide a practical conversation about suitable next steps."}
          </p>
          <Link
            to={
              build
                ? "/construction-quotation"
                : s.slug === "sell-property"
                  ? "/submit-property"
                  : "/requirements"
            }
            className="button navy"
          >
            {build
              ? "Request a Project Quotation"
              : s.slug === "sell-property"
                ? "Submit Your Property"
                : "Share Your Requirements"}{" "}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="ivory section">
        <div className="wrap">
          <Eyebrow>THE PROCESS</Eyebrow>
          <h2>
            Considered at
            <br />
            <em>every stage.</em>
          </h2>
          <div className="process-grid">
            {s.steps.map((step: string, i: number) => (
              <div key={step}>
                <span>0{i + 1}</span>
                <h3>{step}</h3>
                <p>
                  {
                    [
                      "An open conversation about priorities, expectations and your individual needs.",
                      "Define the options, requirements and scope with a clear understanding of the details.",
                      "Review the practical considerations and coordinate appropriate professional input.",
                      "Agree the next steps, responsibilities and the way forward together.",
                    ][i]
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {build && (
        <>
          <section className="section wrap">
            <div className="section-heading">
              <div>
                <Eyebrow>DETAILS THAT DEFINE A SPACE</Eyebrow>
                <h2>
                  Materials. Light.
                  <br />
                  <em>A sense of place.</em>
                </h2>
              </div>
              <Link to="/projects" className="text-link">
                Explore Architectural Inspiration <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="material-grid">
              {[
                ["Natural textures", "/assets/architecture.jpg"],
                ["Refined finishes", "/assets/interior.jpg"],
                ["Connected living", "/assets/garden.jpg"],
              ].map(([t, im]) => (
                <div key={t}>
                  <img src={im} alt={t} loading="lazy" />
                  <h3>{t}</h3>
                  <small>DESIGN INSPIRATION</small>
                </div>
              ))}
            </div>
            <p className="sample-note">
              Concept imagery only. Materials, specifications, pricing and
              delivery schedules are agreed per project.
            </p>
          </section>
        </>
      )}
      <ConsultationCTA />
    </>
  );
}
function ProjectsPage() {
  const live = usePublished("project").map((c) => ({
    ...c,
    category: "Verified project",
    text: c.body,
  }));
  const allProjects = [...live, ...projects];
  const [filter, setFilter] = useState("All");
  return (
    <>
      <PageHero
        eyebrow="ARCHITECTURAL PERSPECTIVES"
        title={
          <>
            A vision of
            <br />
            <em>what could be.</em>
          </>
        }
        text="Explore spaces, materials and ideas that inspire a thoughtful approach to property."
        image="/assets/construction.jpg"
      />
      <section className="section wrap">
        <div className="notice">
          The initial gallery features architectural inspiration, not completed
          M. Star Associates projects. Verified projects will be explicitly
          labeled when published.
        </div>
        <div className="listing-purpose project-tabs">
          {[
            "All",
            ...(live.length ? ["Verified project"] : []),
            "Residential concept",
            "Interior inspiration",
            "Landscape inspiration",
          ].map((f) => (
            <button
              key={f}
              className={filter === f ? "selected" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="projects-editorial">
          {allProjects
            .filter((p) => filter === "All" || p.category === filter)
            .map((p, i) => (
              <Link
                to={"/projects/" + p.slug}
                className="project-feature reveal"
                key={p.slug}
              >
                <div className="image-zoom">
                  <img src={p.image} alt={p.title} loading="lazy" />
                </div>
                <div>
                  <small>{p.category.toUpperCase()}</small>
                  <h2>{p.title}</h2>
                  <ArrowUpRight size={30} />
                </div>
              </Link>
            ))}
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
function ProjectDetail({ slug }: any) {
  const live = usePublished("project").map((c) => ({
    ...c,
    category: "Verified project",
    text: c.body,
  }));
  const p = [...live, ...projects].find((p) => p.slug === slug);
  if (!p) return <NotFound />;
  return (
    <>
      <PageHero
        eyebrow={p.category.toUpperCase()}
        title={p.title}
        image={p.image}
      />
      <section className="section wrap editorial-two">
        <div>
          <Eyebrow>INSPIRATION, CONSIDERED</Eyebrow>
          <h2>
            Space to
            <br />
            <em>imagine.</em>
          </h2>
        </div>
        <div>
          <p className="lead">{p.text}</p>
          <p>
            Use this as a starting point for a conversation about your own site,
            needs and ambitions. A project’s final design and execution require
            a tailored brief and professional review.
          </p>
          <Link to="/construction-quotation" className="button navy">
            Discuss Your Vision <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
function Investment() {
  return (
    <>
      <PageHero
        eyebrow="PROPERTY INVESTMENT"
        title={
          <>
            See the potential.
            <br />
            Consider the <em>possibilities.</em>
          </>
        }
        text="Begin with your goals. Understand the context. Make an informed next move."
        image="/assets/office.jpg"
      />
      <section className="section wrap editorial-two">
        <div>
          <Eyebrow>A LONGER VIEW</Eyebrow>
          <h2>
            Perspective before
            <br />
            <em>commitment.</em>
          </h2>
        </div>
        <div>
          <p className="lead">
            Property investment starts with the right questions.
          </p>
          <p>
            Discuss your objectives, time horizon, budget and preferred property
            type with our team. We can help frame a property search or
            development conversation around those priorities.
          </p>
          <p>
            There are no verified investment offers published here yet. Sample
            listings are illustrative and do not establish market values, rental
            yields or returns.
          </p>
          <div className="notice">
            Property values and returns may rise or fall. No returns are
            guaranteed. Seek independent financial, legal and tax advice before
            investing.
          </div>
          <Link to="/consultation" className="button navy">
            Discuss Your Investment Goals <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="section ivory">
        <div className="wrap">
          <Eyebrow>QUESTIONS WORTH ASKING</Eyebrow>
          <div className="values-grid">
            {[
              [
                "The full cost",
                "Consider transaction costs, maintenance, taxes, vacancy and financing.",
              ],
              [
                "The practical picture",
                "Verify title, approvals, permitted use, access, utilities and property condition.",
              ],
              [
                "Your time horizon",
                "Think about liquidity, management responsibilities and changing needs.",
              ],
            ].map(([t, d]) => (
              <div key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
function Insights() {
  const live = usePublished("blog").map((c) => ({
    ...c,
    category: "Property journal",
    date: new Date(c.created_at).toLocaleDateString("en-PK", {
      timeZone: "Asia/Karachi",
      month: "long",
      year: "numeric",
    }),
  }));
  return (
    <>
      <PageHero
        eyebrow="THE PROPERTY JOURNAL"
        title={
          <>
            Ideas. Insight.
            <br />
            <em>A fresh perspective.</em>
          </>
        }
        text="Thoughtful reading for your next property decision."
      />
      <section className="section wrap">
        <div className="insights-grid">
          {[...live, ...articles].map((a) => (
            <Link
              to={"/insights/" + a.slug}
              className="insight-card reveal"
              key={a.slug}
            >
              <div className="image-zoom">
                <img src={a.image} alt={a.title} />
              </div>
              <small>
                {a.category} · {a.date}
              </small>
              <h3>{a.title}</h3>
              <span className="text-link">
                Read the Story <ArrowUpRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
function Article({ slug }: any) {
  const live = usePublished("blog").map((c) => ({
    ...c,
    category: "Property journal",
    date: new Date(c.created_at).toLocaleDateString("en-PK", {
      timeZone: "Asia/Karachi",
      month: "long",
      year: "numeric",
    }),
    body: c.body.split("\n").filter(Boolean),
  }));
  const a = [...live, ...articles].find((a) => a.slug === slug);
  if (!a) return <NotFound />;
  return (
    <>
      <PageHero
        eyebrow={a.category.toUpperCase()}
        title={a.title}
        text={a.date}
        image={a.image}
      />
      <article className="article-body section">
        <Link to="/insights" className="text-link">
          <ArrowLeft size={15} /> Back to the journal
        </Link>
        {a.body.map((p: string, i: number) => (
          <p className={i === 0 ? "lead" : ""} key={p}>
            {p}
          </p>
        ))}
        <p className="sample-note">
          Editorial guidance from M. Star Associates. General information only.
          Verify current requirements with qualified professionals.
        </p>
        <Link to="/consultation" className="button navy">
          Let’s Discuss Your Next Step <ArrowUpRight size={17} />
        </Link>
      </article>
    </>
  );
}
function FAQ() {
  const live = usePublished("faq").map((c) => [c.title, c.body]);
  const [open, setOpen] = useState(0);
  return (
    <>
      <PageHero
        eyebrow="A LITTLE MORE CLARITY"
        title={
          <>
            Good questions.
            <br />
            <em>Thoughtful answers.</em>
          </>
        }
      />
      <section className="section wrap faq-layout">
        <div>
          <h2>
            How can
            <br />
            we <em>help?</em>
          </h2>
          <p>
            For a conversation about your individual requirements, our team is
            here.
          </p>
          <Link to="/contact" className="text-link">
            Contact Us <ArrowUpRight size={17} />
          </Link>
        </div>
        <div>
          {[...live, ...faqs].map(([q, a], i) => (
            <div className="faq-item" key={q}>
              <button
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {q}
                {open === i ? <Minus size={18} /> : <Plus size={18} />}
              </button>
              {open === i && <p>{a}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
export function FormField({ label, children }: any) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function LeadForm({
  kind = "Consultation",
  property = "",
  onSuccess,
}: any) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const started = useRef(Date.now());
  const isProperty = ["Property submission", "Property valuation"].includes(
    kind,
  );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          kind,
          property,
          consent,
          source: location.pathname,
          elapsed: Date.now() - started.current,
        }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error || "We could not save your request. Please try again.",
        );
      setSuccess(d.reference);
      onSuccess?.();
    } catch (e: any) {
      setError(e.message || "Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={46} strokeWidth={1} />
        <h3>
          A conversation
          <br />
          <em>worth starting.</em>
        </h3>
        <p>Your request has been securely received.</p>
        <p>
          Reference: <strong>{success}</strong>
        </p>
        <p className="sample-note">
          Appointments and viewings are requests until confirmed by the team.
        </p>
        <button
          className="text-link"
          onClick={() => {
            setSuccess("");
            started.current = Date.now();
          }}
        >
          Send another request <ArrowUpRight size={16} />
        </button>
      </div>
    );
  return (
    <form className="lead-form" onSubmit={submit}>
      <div className="form-row">
        <FormField label="Your name *">
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="Full name"
          />
        </FormField>
        <FormField label="Phone number *">
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={25}
            placeholder="+92"
          />
        </FormField>
      </div>
      <FormField label="Email address *">
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={160}
          placeholder="you@example.com"
        />
      </FormField>
      <div className="form-row">
        <FormField label="I’m interested in">
          <select name="interest" defaultValue={kind}>
            <option>{kind}</option>
            {services.map((s) => (
              <option key={s.slug}>{s.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Preferred date (optional)">
          <input
            name="date"
            type="date"
            min={new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Karachi",
            }).format(new Date())}
          />
        </FormField>
      </div>
      {isProperty && (
        <>
          <div className="form-row">
            <FormField label="Property location *">
              <input
                name="location"
                required
                placeholder="Area, neighbourhood and city"
              />
            </FormField>
            <FormField label="Property type *">
              <select name="propertyType" required>
                <option>House</option>
                <option>Apartment</option>
                <option>Office</option>
                <option>Plot</option>
                <option>Other commercial</option>
              </select>
            </FormField>
          </div>
          <div className="form-row">
            <FormField label="Property area">
              <input name="area" type="number" min="0" placeholder="Size" />
            </FormField>
            <FormField label="Area unit">
              <select name="unit">
                <option>Square yards</option>
                <option>Square feet</option>
                <option>Marla (272.25 sq. ft.)</option>
                <option>Kanal (5,445 sq. ft.)</option>
              </select>
            </FormField>
          </div>
        </>
      )}
      <FormField
        label={
          isProperty
            ? "Property details and condition *"
            : "Tell us a little more *"
        }
      >
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={4}
          placeholder={
            isProperty
              ? "Share property condition, asking price, ownership information and what you need help with."
              : "Share your requirements, preferred location, budget or the project you have in mind."
          }
        />
      </FormField>
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave blank
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>
          I agree to be contacted about my request and have read the{" "}
          <a href="/privacy" target="_blank">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="button navy" disabled={busy}>
        {busy ? "Securely sending…" : "Begin the Conversation"}{" "}
        {!busy && <ArrowUpRight size={17} />}
      </button>
      <p className="sample-note">
        Your details are used to respond to this request. Please don’t include
        sensitive financial or identity documents.
      </p>
    </form>
  );
}
function ContactPage({ path, config }: any) {
  const cfg: any = {
    "/contact": [
      "GET IN TOUCH",
      <>
        Good things begin
        <br />
        with a <em>conversation.</em>
      </>,
      "General inquiry",
    ],
    "/consultation": [
      "YOUR NEXT CHAPTER",
      <>
        Let’s explore
        <br />
        the <em>possibilities.</em>
      </>,
      "Consultation",
    ],
    "/valuation": [
      "KNOW YOUR PROPERTY",
      <>
        A clearer view
        <br />
        of your property’s <em>potential.</em>
      </>,
      "Property valuation",
    ],
    "/submit-property": [
      "LIST WITH CONFIDENCE",
      <>
        Your property.
        <br />
        Our thoughtful <em>approach.</em>
      </>,
      "Property submission",
    ],
    "/requirements": [
      "A MORE PERSONAL SEARCH",
      <>
        Tell us what
        <br />
        <em>home means to you.</em>
      </>,
      "Property requirement",
    ],
    "/construction-quotation": [
      "FROM IDEAS TO A CLEAR BRIEF",
      <>
        Every great space
        <br />
        starts with a <em>vision.</em>
      </>,
      "Construction quotation",
    ],
  };
  const [eyebrow, title, kind] = cfg[path];
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} />
      <section className="section wrap contact-layout">
        <div className="contact-details">
          <Eyebrow>PERSONAL. CONSIDERED. CONNECTED.</Eyebrow>
          <h2>
            Your vision.
            <br />
            We’re <em>listening.</em>
          </h2>
          <p>
            Whether you have a clear plan or an idea taking shape, share what
            matters to you.
          </p>
          <div className="contact-address">
            <MapPin size={24} strokeWidth={1} />
            <div>
              <h4>Visit our office</h4>
              <p>{address}.</p>
              <a
                href={
                  "https://www.google.com/maps/search/?api=1&query=" +
                  encodeURIComponent("M Star Associates " + address)
                }
                target="_blank"
                rel="noreferrer"
                className="text-link"
              >
                Get Directions <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
          <div className="contact-address">
            <Clock size={23} strokeWidth={1} />
            <div>
              <h4>Here for your next chapter</h4>
              <p>
                Always open for inquiries.
                <br />
                Office visits by appointment.
              </p>
            </div>
          </div>
          <div className="contact-address">
            <Phone size={23} />
            <div>
              <h4>Two direct lines. One trusted partner.</h4>
              <ContactNumbers config={config} />
            </div>
          </div>
          <div className="contact-social">
            <h4>Stay connected</h4>
            <SocialLinks config={config} />
          </div>
          {config.email && (
            <div className="contact-address">
              <Mail size={23} />
              <a href={"mailto:" + config.email}>{config.email}</a>
            </div>
          )}
          <div className="languages">
            <span>English</span>
            <span>اردو</span>
            <span>سنڌي</span>
          </div>
        </div>
        <div className="contact-form-panel">
          <h3>
            {kind === "Consultation"
              ? "Book a private consultation."
              : "Let’s get to know your plans."}
          </h3>
          <p>
            Share a few details and start your conversation with M. Star
            Associates.
          </p>
          <LeadForm key={kind} kind={kind} />
        </div>
      </section>
    </>
  );
}
function Legal({ privacy }: any) {
  return (
    <>
      <PageHero
        eyebrow="THE DETAILS THAT MATTER"
        title={
          privacy ? (
            <>
              Your privacy.
              <br />
              <em>Respected.</em>
            </>
          ) : (
            <>
              Clear terms.
              <br />
              <em>Shared understanding.</em>
            </>
          )
        }
      />
      <article className="article-body section">
        <p className="sample-note">Last updated: 14 November 2026</p>
        {(privacy
          ? [
              [
                "Who we are",
                "M. Star Associates is a real estate, construction and development business based at " +
                  address +
                  ".",
              ],
              [
                "Information you share",
                "When you submit an inquiry, we collect your name, phone number, email address, request details and any optional property information or preferred date you provide. Please avoid submitting identity documents or sensitive financial information.",
              ],
              [
                "How information is used",
                "We use your details to respond to your inquiry, coordinate requested appointments and administer property-related services. We do not sell inquiry details.",
              ],
              [
                "Storage and access",
                "Requests are stored in the website’s hosted database. Administrative access requires authentication and server-side authorization. Authorized personnel can review and manage requests.",
              ],
              [
                "Device storage and third parties",
                "Saved property preferences are stored on your device. Fonts may be loaded from Google Fonts. Map and WhatsApp links open third-party services under their own privacy terms. No optional marketing analytics are enabled by default.",
              ],
              [
                "Your choices",
                "Use the contact form to request access, correction or deletion of your inquiry details. Include your inquiry reference if available. Information is retained only as needed for the inquiry and applicable legal obligations.",
              ],
            ]
          : [
              [
                "Using this website",
                "This website introduces M. Star Associates services and allows visitors to share property and project requirements. It does not constitute a property sale, rental agreement or professional advisory engagement.",
              ],
              [
                "Sample content",
                "All listings marked Sample are demonstrations. Their prices, specifications, photographs and general area descriptions are illustrative. Architectural concepts are not completed company projects.",
              ],
              [
                "Property information",
                "Actual availability, price, ownership, title, approvals, dimensions and condition must be independently verified before any transaction. Information may change.",
              ],
              [
                "Requests and appointments",
                "Form submissions are requests only. An appointment, viewing, valuation or service scope is not confirmed until separately agreed by the team. Initial estimates are indicative.",
              ],
              [
                "Professional advice",
                "Content is general information and is not legal, tax, financial or structural advice. Seek qualified independent advice and conduct due diligence. Investment returns are not guaranteed.",
              ],
              [
                "Responsible use",
                "Do not submit misleading listings, personal data without authority, abusive messages or unlawful material. M. Star Associates may decline inappropriate requests.",
              ],
              [
                "Contact and changes",
                "For questions, use the contact form or visit our office by appointment at " +
                  address +
                  ". These terms may be updated as the service develops.",
              ],
            ]
        ).map(([t, d]) => (
          <section key={t}>
            <h3>{t}</h3>
            <p>{d}</p>
          </section>
        ))}
        <Link to="/contact" className="text-link">
          Contact M. Star Associates <ArrowUpRight size={16} />
        </Link>
      </article>
    </>
  );
}
function ConsultationCTA() {
  return (
    <section className="consultation-cta navy-bg">
      <div className="wrap reveal">
        <Eyebrow>YOUR NEXT CHAPTER STARTS HERE</Eyebrow>
        <h2>
          Let’s find something
          <br />
          <em>extraordinary.</em>
        </h2>
        <p>A new home. A considered investment. A vision brought to life.</p>
        <Link to="/consultation" className="button gold">
          Book a Private Consultation <ArrowUpRight size={18} />
        </Link>
        <span className="cta-outline">M</span>
      </div>
    </section>
  );
}
function Footer({ config }: any) {
  return (
    <footer>
      <div className="footer-main wrap">
        <div className="footer-brand">
          <Brand large />
          <p>
            Your trusted partner in real estate.
            <br />A thoughtful approach to every possibility.
          </p>
          <div className="footer-location">
            <MapPin size={15} /> KARACHI, PAKISTAN
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/properties">Our Properties</Link>
          <Link to="/about">Our Story</Link>
          <Link to="/projects">Architectural Inspiration</Link>
          <Link to="/investment">Investment</Link>
          <Link to="/insights">Property Journal</Link>
        </div>
        <div>
          <h4>How We Can Help</h4>
          <Link to="/services">Our Services</Link>
          <Link to="/valuation">Property Valuation</Link>
          <Link to="/submit-property">Submit Your Property</Link>
          <Link to="/construction-quotation">Construction Quotation</Link>
          <Link to="/faq">Frequently Asked Questions</Link>
        </div>
        <div className="footer-office">
          <h4>Let’s Connect</h4>
          <p>
            Lane 4C, Building No. 4, Office No. 1,
            <br />
            Nishat Commercial, Phase 6,
            <br />
            DHA, Karachi, Pakistan, 75500.
          </p>
          <Link to="/contact" className="text-link">
            Start a Conversation <ArrowUpRight size={16} />
          </Link>
          <ContactNumbers config={config} compact />
          <SocialLinks config={config} compact />
          <span>ENGLISH · اردو · سنڌي</span>
        </div>
      </div>
      <div className="footer-bottom wrap">
        <span>
          © {new Date().getFullYear()} M. Star Associates. All rights reserved.
        </span>
        <div>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/admin">Admin</Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            BACK TO TOP ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
export function Modal({ title, close, children }: any) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          'button,a,input,select,textarea,[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={close} aria-label="Close dialog">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function NotFound() {
  return (
    <section className="empty-state not-found">
      <Eyebrow>A NEW DIRECTION</Eyebrow>
      <h1>
        Let’s find
        <br />
        your <em>way.</em>
      </h1>
      <p>This page is not part of our collection.</p>
      <Link to="/" className="button navy">
        Return Home <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
