import { useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Move,
  Expand,
  Minus,
  Plus,
  ArrowUpRight,
  Pause,
  Play,
} from "lucide-react";
import type { VillaExperience } from "./villa-scene";
export default function Architecture({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<VillaExperience | null>(null);
  const [mode, setMode] = useState<"loading" | "ready" | "fallback">("loading");
  const [view, setView] = useState("Perspective");
  const [full, setFull] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let generation = 0;
    let delay: ReturnType<typeof setTimeout>;
    const menuOpen = () =>
      !!document.querySelector(
        '.premium-navigation.open, .mega-trigger[aria-expanded="true"]',
      );
    let scene: VillaExperience | undefined;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const dataSaving = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const economy =
      !!dataSaving ||
      !!(memory && memory < 4) ||
      !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
    const fail = () => {
      scene?.dispose();
      scene = undefined;
      control.current = null;
      if (!disposed) setMode("fallback");
    };
    const load = async () => {
      // Preparing WebGL should never interrupt an open navigation panel.
      if (menuOpen()) {
        delay = setTimeout(load, 300);
        return;
      }
      const currentGeneration = ++generation;
      try {
        const { createVillaExperience } = await import("./villa-scene");
        if (disposed || currentGeneration !== generation) return;
        if (menuOpen()) {
          delay = setTimeout(load, 300);
          return;
        }
        scene?.dispose();
        scene = createVillaExperience(el, { reduced: motion.matches, economy });
        scene.pause(pausedRef.current);
        control.current = scene;
        setMode("ready");
      } catch {
        fail();
      }
    };
    el.addEventListener("villa-context-lost", fail);
    const changeMotion = () => {
      setReduced(motion.matches);
      scene?.dispose();
      scene = undefined;
      setMode("loading");
      void load();
    };
    motion.addEventListener("change", changeMotion);
    // Let the editorial entrance and logo finish before preparing WebGL.
    delay = setTimeout(load, 1000);
    return () => {
      disposed = true;
      clearTimeout(delay);
      motion.removeEventListener("change", changeMotion);
      el.removeEventListener("villa-context-lost", fail);
      scene?.dispose();
      control.current = null;
    };
  }, []);
  useEffect(() => {
    if (!full) return;
    const old = document.body.style.overflow;
    const previous = document.activeElement as HTMLElement;
    const stage = host.current?.parentElement;
    document.body.style.overflow = "hidden";
    const items = () =>
      stage?.querySelectorAll<HTMLElement>("button,canvas[tabindex]");
    items()?.[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = items();
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [full]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  return (
    <div
      className={`architecture-stage ${mode} ${full ? "architecture-fullscreen" : ""}`}
      role={full ? "dialog" : undefined}
      aria-modal={full || undefined}
      aria-label="Original architectural concept presentation"
    >
      <div ref={host} className="architecture-canvas" />
      <div className="architecture-fallback">
        <img
          src="/assets/villa-poster.webp"
          alt="Contemporary villa architectural inspiration"
        />
        <div />
      </div>
      <div className="architectural-coordinates">
        <span>24°48′ N — 67°01′ E</span>
        <i />
        <span>ARCHITECTURE / POSSIBILITIES</span>
      </div>
      <div className="architecture-label">
        <span className="live-dot" />
        {mode === "ready"
          ? "LIVE ARCHITECTURAL CONCEPT"
          : "ARCHITECTURAL INSPIRATION"}
        <span className="architecture-label-note">
          Original concept. Not a listed property.
        </span>
      </div>
      {mode === "loading" && (
        <div className="scene-loading">
          <span />
          <small>SETTING THE SCENE</small>
        </div>
      )}
      {mode === "ready" && (
        <>
          <div className="scene-views" aria-label="Architectural camera views">
            {["Perspective", "Elevation", "Courtyard"].map((v) => (
              <button
                key={v}
                className={view === v ? "selected" : ""}
                onClick={() => {
                  setView(v);
                  control.current?.preset(v);
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="scene-controls">
            <span>
              <Move size={12} /> Drag to explore
            </span>
            {!reduced && (
              <button
                aria-label={
                  paused
                    ? "Play architectural tour"
                    : "Pause architectural tour"
                }
                aria-pressed={paused}
                onClick={() => {
                  pausedRef.current = !paused;
                  control.current?.pause(!paused);
                  setPaused(!paused);
                }}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}
            <button
              aria-label="Zoom out"
              onClick={() => control.current?.zoom(1.1)}
            >
              <Minus size={15} />
            </button>
            <button
              aria-label="Zoom in"
              onClick={() => control.current?.zoom(0.9)}
            >
              <Plus size={15} />
            </button>
            <button
              aria-label="Reset architectural view"
              onClick={() => {
                setView("Perspective");
                control.current?.preset("Perspective");
              }}
            >
              <RotateCcw size={14} />
            </button>
            {!embedded && (
              <button
                aria-label={
                  full ? "Exit full-screen architecture" : "Expand architecture"
                }
                aria-pressed={full}
                onClick={() => setFull(!full)}
              >
                <Expand size={14} />
              </button>
            )}
          </div>
        </>
      )}
      {full && (
        <button className="scene-close" onClick={() => setFull(false)}>
          Close presentation <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
