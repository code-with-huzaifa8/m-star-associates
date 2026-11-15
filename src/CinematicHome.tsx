import {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

type Photograph = "arrival" | "residence" | "poolside";
export function CinemaPhoto({
  name,
  alt = "",
  priority = false,
  className = "",
  sizes = "100vw",
}: {
  name: Photograph;
  alt?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <picture className={className}>
      <source
        media="(max-width: 600px)"
        srcSet={`/assets/cinema/${name}-portrait.webp`}
      />
      <img
        src={`/assets/cinema/${name}-2000.webp`}
        srcSet={`/assets/cinema/${name}-1280.webp 1280w, /assets/cinema/${name}-2000.webp 2000w`}
        sizes={sizes}
        width="2000"
        height="1333"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
      />
    </picture>
  );
}
export function CinematicMedia() {
  return (
    <>
      <div className="film-media" aria-hidden="true">
        <div className="film-shot film-shot-primary">
          <div className="film-photo-plane">
            <CinemaPhoto name="arrival" priority />
          </div>
        </div>
        <div className="film-shot film-shot-secondary">
          <div className="film-photo-plane">
            <CinemaPhoto name="residence" />
          </div>
        </div>
      </div>
      <div className="film-light-wash" aria-hidden="true" />
      <div className="film-curtain" aria-hidden="true" />
    </>
  );
}

/** Native scrolling, scoped GSAP ownership and one shared motion rhythm. */
export function useCinematicHome(
  root: RefObject<HTMLDivElement | null>,
  paused: boolean,
) {
  const ambient = useRef<gsap.core.Tween | null>(null);
  const manualPause = useRef(paused);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    manualPause.current = paused;
    ambient.current?.paused(paused);
  }, [paused]);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = gsap.matchMedia();
    let refreshFrame = 0;
    media.add(
      {
        all: "all",
        motion: "(prefers-reduced-motion: no-preference)",
        wide: "(min-width: 1000px)",
      },
      (ctx) => {
        const motion = !!ctx.conditions?.motion,
          wide = !!ctx.conditions?.wide;
        setReduced(!motion);
        if (!motion) return;
        const select = gsap.utils.selector(el);
        const splits: SplitText[] = [];
        let alive = true;
        const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
        entrance
          .fromTo(
            select(".film-curtain"),
            { scaleY: 1 },
            {
              scaleY: 0,
              transformOrigin: "50% 0%",
              duration: 1.65,
              ease: "power4.inOut",
            },
            0,
          )
          .fromTo(
            select(".hero-line > span"),
            { yPercent: 110, rotation: 1.5 },
            { yPercent: 0, rotation: 0, duration: 1.5, stagger: 0.16 },
            0.5,
          )
          .fromTo(
            select(".hero-eyebrow"),
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 1 },
            0.8,
          )
          .fromTo(
            select(".hero-sub,.hero-actions"),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 },
            1.15,
          )
          .fromTo(
            select(".hero-bottom,.film-photo-credit,.film-utility"),
            { opacity: 0 },
            { opacity: 1, duration: 1.1 },
            1.65,
          );
        ambient.current = gsap.fromTo(
          select(".film-shot img"),
          { scale: 1.035, xPercent: 0 },
          {
            scale: 1.085,
            xPercent: 0.8,
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            paused: manualPause.current,
          },
        );
        const hero = el.querySelector(".film-hero")!;
        let heroVisible = true;
        const playback = () =>
          ambient.current?.paused(
            manualPause.current || document.hidden || !heroVisible,
          );
        const visibility = new IntersectionObserver((entries) => {
          heroVisible = entries[0].isIntersecting;
          playback();
        });
        visibility.observe(hero);
        document.addEventListener("visibilitychange", playback);
        const heroScroll = gsap.timeline({
          scrollTrigger: {
            trigger: ".film-hero-runway",
            start: "top top",
            end: wide ? "bottom bottom" : "bottom top",
            scrub: 1.1,
            invalidateOnRefresh: true,
          },
          defaults: { ease: "none" },
        });
        heroScroll
          .to(
            select(".film-shot-primary .film-photo-plane"),
            { yPercent: 8, scale: 1.08, duration: 1 },
            0,
          )
          .fromTo(
            select(".film-shot-secondary"),
            { clipPath: "inset(0% 0% 0% 100%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55 },
            0.22,
          )
          .fromTo(
            select(".film-shot-secondary .film-photo-plane"),
            { scale: 1.14, yPercent: 3 },
            { scale: 1.02, yPercent: -2, duration: 0.8 },
            0.2,
          )
          .to(
            select(".hero-copy"),
            { y: wide ? -70 : -32, duration: 0.35 },
            0.65,
          );
        // Real line masks preserve text, emphasis and accessible heading names.
        select("h2").forEach((heading: HTMLElement) => {
          const split = SplitText.create(heading, {
            type: "lines",
            mask: "lines",
            linesClass: "film-type-line",
            autoSplit: true,
            aria: "auto",
            onSplit(self) {
              gsap.fromTo(
                self.lines,
                { yPercent: 105 },
                {
                  yPercent: 0,
                  stagger: 0.105,
                  duration: 1.25,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: heading,
                    start: "top 88%",
                    once: true,
                  },
                  clearProps: "transform",
                },
              );
            },
          });
          splits.push(split);
        });
        select(
          ".intro-copy > p,.intro-copy > .text-link,.section-heading > .heading-aside,.why-item,.investment-band p",
        ).forEach((node: HTMLElement) => {
          gsap.fromTo(
            node,
            { y: 26, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: "power2.out",
              scrollTrigger: { trigger: node, start: "top 92%", once: true },
              clearProps: "transform,opacity",
            },
          );
        });
        select(
          ".intro-visual,.location-tile,.insight-card .image-zoom",
        ).forEach((frame: HTMLElement) => {
          gsap.fromTo(
            frame,
            { clipPath: "inset(12% 5% 12% 5%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.4,
              ease: "power3.inOut",
              scrollTrigger: { trigger: frame, start: "top 93%", once: true },
              clearProps: "clipPath",
            },
          );
          const image = frame.querySelector("picture img, img");
          if (image)
            gsap.fromTo(
              image,
              { yPercent: -5, scale: 1.1 },
              {
                yPercent: 5,
                scale: 1.1,
                ease: "none",
                scrollTrigger: {
                  trigger: frame,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1.2,
                },
              },
            );
        });
        select(".collection-grid,.process-grid").forEach(
          (group: HTMLElement) => {
            gsap.fromTo(
              group.children,
              { y: 50, clipPath: "inset(10% 0% 0% 0%)" },
              {
                y: 0,
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1.2,
                stagger: 0.14,
                ease: "power3.out",
                scrollTrigger: { trigger: group, start: "top 88%", once: true },
                clearProps: "transform,clipPath",
              },
            );
          },
        );
        const process = el.querySelector(".process-grid");
        if (process)
          gsap.fromTo(
            process,
            { "--chapter-progress": 0 },
            {
              "--chapter-progress": 1,
              ease: "none",
              scrollTrigger: {
                trigger: process,
                start: "top 85%",
                end: "bottom 50%",
                scrub: 0.8,
              },
            },
          );
        const construction = el.querySelector(".construction-section");
        if (construction) {
          gsap.fromTo(
            construction.querySelector(".film-construction-photo"),
            { yPercent: -9, scale: 1.15 },
            {
              yPercent: 9,
              scale: 1.04,
              ease: "none",
              scrollTrigger: {
                trigger: construction,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.3,
              },
            },
          );
          if (wide)
            ScrollTrigger.create({
              trigger: construction,
              start: "top top",
              end: "+=35%",
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
            });
        }
        document.fonts.ready.then(() => {
          if (!alive) return;
          refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
        });
        return () => {
          alive = false;
          visibility.disconnect();
          document.removeEventListener("visibilitychange", playback);
          splits.forEach((split) => split.revert());
          ambient.current?.kill();
          ambient.current = null;
          cancelAnimationFrame(refreshFrame);
        };
      },
      el,
    );
    return () => {
      media.revert();
      cancelAnimationFrame(refreshFrame);
    };
  }, [root]);
  return reduced;
}
