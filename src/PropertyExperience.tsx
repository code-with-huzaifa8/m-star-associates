import { useEffect, useRef, useState } from "react";
import {
  RotateCcw,
  Plus,
  Minus,
  Expand,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
export default function PropertyExperience({
  src,
  kind,
}: {
  src: string;
  kind: "panorama" | "model";
}) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const actions = useRef<any>(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let cancelled = false;
    let dispose = () => {};
    const el = host.current;
    if (!el) return;
    setStatus("loading");
    const init = async () => {
      try {
        const T = await import("three");
        const { OrbitControls } =
          await import("three/addons/controls/OrbitControls.js");
        if (cancelled) return;
        const renderer = new T.WebGLRenderer({
          antialias: devicePixelRatio < 2,
          alpha: true,
        });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.setSize(el.clientWidth, el.clientHeight);
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        el.appendChild(renderer.domElement);
        renderer.domElement.tabIndex = 0;
        renderer.domElement.setAttribute(
          "aria-label",
          kind === "panorama"
            ? "360 degree property panorama. Use the view controls to rotate and zoom."
            : "Property model. Use the view controls to rotate and zoom.",
        );
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(
          kind === "panorama" ? 75 : 42,
          el.clientWidth / el.clientHeight,
          0.01,
          1000,
        );
        camera.position.set(0, 2, 8);
        const orbit = new OrbitControls(camera, renderer.domElement);
        orbit.enableDamping = true;
        orbit.enablePan = false;
        orbit.enableZoom = kind === "model";
        let frame = 0;
        let observer: ResizeObserver | undefined;
        let disposed = false;
        const free = (root: any) =>
          root.traverse((o: any) => {
            o.geometry?.dispose();
            if (o.material) {
              const ms = Array.isArray(o.material) ? o.material : [o.material];
              ms.forEach((m: any) => {
                m.map?.dispose();
                m.dispose();
              });
            }
          });
        dispose = () => {
          if (disposed) return;
          disposed = true;
          cancelAnimationFrame(frame);
          observer?.disconnect();
          orbit.dispose();
          free(scene);
          renderer.dispose();
          renderer.domElement.remove();
          actions.current = null;
        };
        if (kind === "panorama") {
          const texture = await new T.TextureLoader().loadAsync(src);
          if (cancelled) {
            texture.dispose();
            return;
          }
          texture.colorSpace = T.SRGBColorSpace;
          const root = new T.Mesh(
            new T.SphereGeometry(100, 48, 32),
            new T.MeshBasicMaterial({ map: texture, side: T.BackSide }),
          );
          scene.add(root);
          camera.position.set(0.001, 0, 0);
          orbit.target.set(0, 0, 0);
          orbit.rotateSpeed = -0.35;
          orbit.minDistance = 0.001;
          orbit.maxDistance = 0.001;
        } else {
          const { GLTFLoader } =
            await import("three/addons/loaders/GLTFLoader.js");
          const asset = await new GLTFLoader().loadAsync(src);
          if (cancelled) {
            free(asset.scene);
            return;
          }
          const root = asset.scene;
          scene.add(root);
          const box = new T.Box3().setFromObject(root);
          const size = box.getSize(new T.Vector3());
          root.position.sub(box.getCenter(new T.Vector3()));
          const d = Math.max(size.x, size.y, size.z) || 5;
          camera.position.set(d * 1.2, d * 0.75, d * 1.5);
          orbit.minDistance = d * 0.25;
          orbit.maxDistance = d * 5;
          scene.add(new T.HemisphereLight("#c6dbff", "#192b42", 3));
          const key = new T.DirectionalLight("#fff3dd", 4);
          key.position.set(d, d, d);
          scene.add(key);
        }
        const original = camera.position.clone();
        actions.current = {
          reset: () => {
            camera.position.copy(original);
            camera.fov = kind === "panorama" ? 75 : 42;
            camera.updateProjectionMatrix();
            orbit.update();
          },
          rotate: (n: number) => {
            camera.position.applyAxisAngle(new T.Vector3(0, 1, 0), n * 0.25);
            orbit.update();
          },
          zoom: (n: number) => {
            if (kind === "panorama") {
              camera.fov = Math.min(100, Math.max(35, camera.fov + n * 6));
              camera.updateProjectionMatrix();
            } else {
              const length = camera.position.length();
              camera.position.multiplyScalar(
                Math.min(
                  orbit.maxDistance,
                  Math.max(orbit.minDistance, length * (n > 0 ? 1.1 : 0.9)),
                ) / length,
              );
            }
          },
        };
        const resize = () => {
          if (!el.clientWidth || !el.clientHeight) return;
          renderer.setSize(el.clientWidth, el.clientHeight);
          camera.aspect = el.clientWidth / el.clientHeight;
          camera.updateProjectionMatrix();
        };
        observer = new ResizeObserver(resize);
        observer.observe(el);
        let last = 0;
        const tick = (time: number) => {
          if (cancelled || disposed) return;
          frame = requestAnimationFrame(tick);
          if (document.hidden || time - last < 30) return;
          last = time;
          orbit.update();
          renderer.render(scene, camera);
        };
        frame = requestAnimationFrame(tick);
        if (!cancelled) setStatus("ready");
      } catch {
        dispose();
        if (!cancelled) setStatus("error");
      }
    };
    init();
    return () => {
      cancelled = true;
      dispose();
      if (document.fullscreenElement === stage.current)
        document.exitFullscreen().catch(() => {});
    };
  }, [src, kind]);
  return (
    <div className="property-experience" ref={stage}>
      <div ref={host} className="property-experience-canvas" />
      {status === "loading" && (
        <div className="experience-status">
          <span className="admin-loading" />
          Opening {kind === "panorama" ? "360° panorama" : "property model"}…
        </div>
      )}
      {status === "error" && (
        <div className="experience-status">
          <h3>This view couldn’t be loaded.</h3>
          <p>The asset may be unavailable or unsupported on this device.</p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            Open the original asset
          </a>
        </div>
      )}
      {status === "ready" && (
        <div className="experience-toolbar">
          <span>
            {kind === "panorama"
              ? "Drag to look around"
              : "Drag to rotate the property model"}
          </span>
          <button
            onClick={() => actions.current?.rotate(-1)}
            aria-label="Rotate left"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => actions.current?.rotate(1)}
            aria-label="Rotate right"
          >
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => actions.current?.zoom(1)}
            aria-label="Zoom out"
          >
            <Minus size={17} />
          </button>
          <button
            onClick={() => actions.current?.zoom(-1)}
            aria-label="Zoom in"
          >
            <Plus size={17} />
          </button>
          <button
            onClick={() => actions.current?.reset()}
            aria-label="Reset property view"
          >
            <RotateCcw size={17} />
          </button>
          {document.fullscreenEnabled && (
            <button
              aria-label="Toggle full-screen property experience"
              onClick={() => {
                if (document.fullscreenElement === stage.current)
                  document.exitFullscreen().catch(() => {});
                else stage.current?.requestFullscreen().catch(() => {});
              }}
            >
              <Expand size={17} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
