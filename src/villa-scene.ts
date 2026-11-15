/** Original, metre-scaled architectural study. All geometry and materials are local. */
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { Reflector } from "three/addons/objects/Reflector.js";

export interface VillaExperience {
  preset: (name: string) => void;
  zoom: (factor: number) => void;
  pause: (value: boolean) => void;
  dispose: () => void;
}
const smooth = (v: number) => {
  const t = T.MathUtils.clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};

export function createVillaExperience(
  host: HTMLElement,
  options: { reduced: boolean; economy: boolean },
): VillaExperience {
  const mobile =
    host.clientWidth < 650 || matchMedia("(pointer: coarse)").matches;
  const lite = mobile || options.economy;
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "default",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 1.25 : 1.6));
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Original luxury courtyard villa with a reflecting pool, illuminated rooms, stone terraces and planted gardens. Drag or use arrow keys to explore.",
  );
  canvas.tabIndex = 0;
  host.appendChild(canvas);
  const scene = new T.Scene();
  scene.fog = new T.FogExp2("#081222", 0.012);
  scene.background = new T.Color("#081222");
  const camera = new T.PerspectiveCamera(
    36,
    host.clientWidth / host.clientHeight,
    0.2,
    160,
  );
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minDistance = 17;
  controls.maxDistance = 60;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = 1.47;
  controls.rotateSpeed = 0.45;
  canvas.style.touchAction = "pan-y";

  const textures: T.Texture[] = [];
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const environment = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const env = pmrem.fromScene(environment, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.4;
  environment.dispose();
  pmrem.dispose();

  // Deterministic, seamless surface grain: no remote texture requests or asset licensing.
  function grain(
    kind: "stone" | "wood" | "plaster" | "grass",
    repeats: number,
  ) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const pixels = ctx.createImageData(256, 256);
    let seed = 19;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const i = (y * 256 + x) * 4;
        const wave =
          kind === "wood"
            ? Math.sin(x * 0.23 + Math.sin((y * Math.PI) / 128) * 3) * 14 +
              Math.sin(x * 0.9) * 4
            : kind === "stone"
              ? Math.sin((y * Math.PI) / 32 + Math.sin((x * Math.PI) / 128)) * 6
              : 0;
        const n =
          190 + wave + (random() - 0.5) * (kind === "plaster" ? 12 : 30);
        pixels.data[i] = n;
        pixels.data[i + 1] = n;
        pixels.data[i + 2] = n;
        pixels.data[i + 3] = 255;
      }
    ctx.putImageData(pixels, 0, 0);
    const texture = new T.CanvasTexture(c);
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.repeat.set(repeats, repeats);
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    textures.push(texture);
    return texture;
  }
  const limestoneGrain = grain("stone", 3);
  const woodGrain = grain("wood", 1);
  const plasterGrain = grain("plaster", 2);
  const lawnGrain = grain("grass", 8);
  function standard(params: T.MeshStandardMaterialParameters) {
    const m = new T.MeshStandardMaterial(params);
    materials.add(m);
    return m;
  }
  const limestone = standard({
    color: "#d7ceba",
    roughness: 0.78,
    map: limestoneGrain,
    bumpMap: limestoneGrain,
    bumpScale: 0.035,
  });
  const plaster = standard({
    color: "#e5ded0",
    roughness: 0.75,
    bumpMap: plasterGrain,
    bumpScale: 0.018,
  });
  const travertine = standard({
    color: "#a89d87",
    roughness: 0.6,
    map: limestoneGrain,
    bumpMap: limestoneGrain,
    bumpScale: 0.025,
  });
  const basalt = standard({
    color: "#252c2e",
    roughness: 0.66,
    bumpMap: plasterGrain,
    bumpScale: 0.025,
  });
  const metal = standard({ color: "#292e30", metalness: 0.8, roughness: 0.28 });
  const brass = standard({ color: "#b49461", metalness: 0.75, roughness: 0.3 });
  const teak = standard({
    color: "#80502d",
    roughness: 0.62,
    map: woodGrain,
    bumpMap: woodGrain,
    bumpScale: 0.013,
  });
  const fabric = standard({
    color: "#ded5bf",
    roughness: 1,
    bumpMap: plasterGrain,
    bumpScale: 0.02,
  });
  const cushion = standard({ color: "#69756f", roughness: 1 });
  const rug = standard({ color: "#7d7667", roughness: 1, map: plasterGrain });
  const warm = standard({
    color: "#ffdf9b",
    emissive: "#ffbf64",
    emissiveIntensity: 2.7,
    roughness: 0.4,
  });
  const interiorWall = standard({ color: "#bba78a", roughness: 0.85 });
  const leaves = standard({
    color: "#62724a",
    roughness: 0.88,
    side: T.DoubleSide,
  });
  const hedge = standard({ color: "#344b30", roughness: 1 });
  const lawn = standard({ color: "#344637", roughness: 1, map: lawnGrain });
  const bark = standard({
    color: "#6b5d48",
    roughness: 1,
    bumpMap: woodGrain,
    bumpScale: 0.08,
  });
  const glass = new T.MeshPhysicalMaterial({
    color: "#b1c8cc",
    metalness: 0.08,
    roughness: 0.055,
    transparent: true,
    opacity: 0.24,
    side: T.DoubleSide,
    envMapIntensity: 1.4,
    depthWrite: false,
    clearcoat: 1,
  });
  materials.add(glass);

  const estate = new T.Group();
  scene.add(estate);
  const terrace = new T.Group(),
    structure = new T.Group(),
    upper = new T.Group(),
    screens = new T.Group(),
    planting = new T.Group();
  estate.add(terrace, structure, upper, screens, planting);
  const batches = new Map<T.Group, Map<T.Material, T.BufferGeometry[]>>();
  function geometry(
    group: T.Group,
    g: T.BufferGeometry,
    mat: T.Material,
    position: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
  ) {
    const matrix = new T.Matrix4().compose(
      new T.Vector3(...position),
      new T.Quaternion().setFromEuler(new T.Euler(...rotation)),
      new T.Vector3(1, 1, 1),
    );
    if (g.index) {
      const original = g;
      g = g.toNonIndexed();
      original.dispose();
    }
    g.applyMatrix4(matrix);
    if (!batches.has(group)) batches.set(group, new Map());
    const batch = batches.get(group)!;
    if (!batch.has(mat)) batch.set(mat, []);
    batch.get(mat)!.push(g);
  }
  function box(
    group: T.Group,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    ry = 0,
  ) {
    const g =
      (mat === plaster || mat === limestone || mat === travertine) &&
      Math.min(w, h, d) > 0.15 &&
      w > 0.8
        ? new RoundedBoxGeometry(w, h, d, 2, Math.min(0.035, h * 0.12))
        : new T.BoxGeometry(w, h, d);
    // RoundedBoxGeometry is non-indexed; normalize before batching.
    geometry(group, g.index ? g.toNonIndexed() : g, mat, [x, y, z], [0, ry, 0]);
    if (g.index) g.dispose();
  }
  function cylinder(
    group: T.Group,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
    top = radius,
  ) {
    geometry(group, new T.CylinderGeometry(top, radius, height, 16), mat, [
      x,
      y,
      z,
    ]);
  }
  function sphere(
    group: T.Group,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    r: number,
    sx = 1,
    sy = 1,
    sz = 1,
  ) {
    const g = new T.SphereGeometry(r, 12, 8);
    g.scale(sx, sy, sz);
    geometry(group, g, mat, [x, y, z]);
  }
  // Site: recessed plinth, generous paving, inset beds and an actual lowered pool basin.
  box(terrace, basalt, 0, -0.52, 0.8, 24, 0.85, 21);
  box(terrace, travertine, 0, -0.075, 0.6, 22.9, 0.12, 19.9);
  // Individual stone tiles retain precise joints instead of a flat featureless plane.
  for (let x = -10.6; x <= 10.6; x += 1.78)
    for (let z = -8.2; z <= 9.3; z += 1.78) {
      if (x < 2 && x > -8.8 && z > 4.1 && z < 8.9) continue;
      box(terrace, limestone, x, 0.012, z, 1.75, 0.07, 1.75);
    }
  box(terrace, basalt, -3.7, -0.08, 6.65, 8.5, 0.18, 4.15);
  box(terrace, travertine, -3.7, -0.12, 6.65, 8.05, 0.08, 3.7);
  for (const z of [4.58, 8.72])
    box(terrace, limestone, -3.7, 0.11, z, 8.8, 0.18, 0.24);
  for (const x of [-8, 0.6])
    box(terrace, limestone, x, 0.11, 6.65, 0.25, 0.18, 4.4);
  for (let i = 0; i < 4; i++)
    box(
      terrace,
      limestone,
      4.1,
      -0.02 + i * 0.085,
      7.8 - i * 0.55,
      4.5,
      0.17,
      0.95,
    );
  box(terrace, lawn, 9.1, 0.07, -0.5, 3.8, 0.09, 15.8);
  box(terrace, lawn, -9.25, 0.07, -0.8, 2, 0.09, 14.6);
  // A floating two-storey L-plan villa, 14m wide with a recessed upper living wing.
  box(structure, plaster, 0, 0.31, -0.5, 14.5, 0.38, 9.1);
  box(structure, basalt, 0, 0.55, -0.5, 14.4, 0.1, 9);
  box(structure, teak, 0, 0.61, -0.5, 13.9, 0.04, 8.6);
  box(structure, plaster, 0, 3.73, -0.6, 15, 0.32, 9.3);
  box(structure, basalt, 0, 3.52, -0.6, 14.8, 0.08, 9.05);
  box(structure, teak, 0.6, 3.46, 0.5, 12.7, 0.04, 6.8);
  box(structure, limestone, -5.5, 2.1, -1.2, 3.05, 3.1, 7.4);
  // Travertine blocks on the entrance tower, with recessed joints.
  for (let y = 0.8; y < 3.4; y += 0.43)
    for (let x = -6.9; x < -4; x += 0.61)
      box(structure, travertine, x, y, 2.52, 0.59, 0.405, 0.055);
  box(structure, interiorWall, 1.3, 2.02, -4.7, 10.1, 2.85, 0.18);
  box(structure, limestone, 6.8, 2.02, -2.8, 0.32, 2.85, 3.7);
  for (const x of [-3.75, 2.5, 6.8])
    box(structure, metal, x, 2.04, 3.5, 0.12, 2.88, 0.12);
  // Pivot entry door, metal reveal, and bronze handle.
  box(structure, metal, -4.12, 1.99, 2.59, 1.6, 2.82, 0.16);
  box(structure, teak, -4.08, 1.99, 2.7, 1.42, 2.68, 0.09);
  box(structure, brass, -3.57, 1.97, 2.77, 0.035, 0.91, 0.035);
  box(structure, warm, -4.93, 2.05, 2.63, 0.018, 2.7, 0.02);
  // Continuous glazing, with individually divided doors and returns.
  function glazing(
    group: T.Group,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    count: number,
    side = false,
  ) {
    for (let i = 0; i < count; i++) {
      const p = x - width / 2 + ((i + 0.5) * width) / count;
      if (!side) {
        box(group, glass, p, y, z, width / count - 0.055, height, 0.025);
        box(
          group,
          metal,
          p - width / count / 2,
          y,
          z + 0.025,
          0.045,
          height + 0.05,
          0.075,
        );
        if (i % 2 === 0)
          box(
            group,
            brass,
            p + (width / count) * 0.4,
            y - 0.15,
            z + 0.08,
            0.018,
            0.32,
            0.025,
          );
      } else {
        box(group, glass, z, y, p, 0.025, height, width / count - 0.055);
        box(
          group,
          metal,
          z + 0.025,
          y,
          p - width / count / 2,
          0.075,
          height + 0.05,
          0.045,
        );
      }
    }
    if (!side)
      for (const yy of [y - height / 2, y + height / 2])
        box(group, metal, x, yy, z, width, 0.045, 0.075);
  }
  glazing(structure, 1.48, 2.04, 3.48, 10.5, 2.83, 7);
  glazing(structure, 0.1, 2.04, 6.89, 6.8, 2.83, 4, true);
  // Upper volume: asymmetric picture frame, inset bedroom, wraparound glass balcony.
  box(upper, plaster, 0.4, 6.98, -1.02, 14.6, 0.3, 8.5);
  box(upper, basalt, 0.4, 6.77, -1.02, 14.35, 0.08, 8.25);
  box(upper, teak, 0.6, 6.7, -0.5, 13.6, 0.045, 7.2);
  box(upper, plaster, -6.72, 5.36, -0.95, 0.34, 2.9, 8.25);
  for (const z of [-5.02, 3.05])
    box(upper, plaster, 7.52, 5.36, z, 0.34, 2.9, 0.36);
  // Glazed east elevation beneath a deep perimeter frame.
  for (let i = 0; i < 13; i++)
    box(screens, teak, 7.62, 5.28, -4.65 + i * 0.24, 0.42, 2.72, 0.075);
  box(upper, interiorWall, 0.4, 5.27, -4.85, 13.8, 2.6, 0.2);
  box(upper, limestone, -2.8, 5.26, -1.3, 0.22, 2.62, 6.1);
  box(upper, teak, -5.15, 5.25, -0.6, 2.8, 2.63, 0.22);
  glazing(upper, 2.1, 5.25, 1.92, 9.9, 2.63, 7);
  glazing(upper, -1.6, 5.25, 7.32, 6.4, 2.63, 4, true);
  box(upper, limestone, 1.3, 3.98, 3.17, 12.2, 0.18, 1.95);
  box(upper, glass, 1.3, 4.64, 4.08, 12.1, 1.1, 0.035);
  box(upper, brass, 1.3, 5.2, 4.08, 12.1, 0.035, 0.055);
  for (let x = -4.7; x < 7.4; x += 1.52)
    box(upper, metal, x, 4.63, 4.07, 0.025, 1.16, 0.04);
  box(upper, glass, 7.34, 4.64, 2.82, 0.03, 1.1, 2.5);
  box(upper, brass, 7.34, 5.2, 2.82, 0.05, 0.035, 2.5);
  // Deep timber privacy screens and pergola slats have believable thickness and fixings.
  for (let i = 0; i < 19; i++)
    box(screens, teak, -6.52 + i * 0.19, 5.28, 3.08, 0.075, 2.78, 0.48);
  for (const y of [3.94, 6.6])
    box(screens, metal, -4.8, y, 2.92, 3.55, 0.055, 0.12);
  for (let i = 0; i < 22; i++)
    box(screens, teak, 7.73, 2.06, -4.2 + i * 0.34, 1.45, 0.085, 0.1);
  for (const z of [-4.2, 3])
    box(screens, metal, 8.35, 2.06, z, 0.075, 2.9, 0.075);
  // Warm cove lights and recessed downlights, restrained rather than neon outlines.
  box(structure, warm, 1.35, 3.42, 3.47, 10.5, 0.025, 0.04);
  box(upper, warm, 0.5, 6.66, 3.08, 13.7, 0.022, 0.035);
  box(upper, warm, 7.3, 6.66, -0.7, 0.03, 0.022, 7.5);
  for (let x = -2.6; x < 6.9; x += 1.9) {
    cylinder(structure, metal, x, 3.44, 2.1, 0.095, 0.035);
    cylinder(structure, warm, x, 3.41, 2.1, 0.065, 0.013);
  }
  // Furnished rooms prevent the glass facade from reading as an empty shell.
  function sofa(group: T.Group, x: number, y: number, z: number, ry = 0) {
    const g = new T.Group();
    group.add(g);
    g.position.set(x, y, z);
    g.rotation.y = ry;
    box(g, fabric, 0, 0.42, 0, 2.65, 0.38, 1.05);
    box(g, fabric, 0, 0.78, -0.43, 2.65, 0.5, 0.23);
    for (const xx of [-1.29, 1.29])
      box(g, fabric, xx, 0.65, 0, 0.18, 0.46, 1.05);
    for (const xx of [-1.05, 1.05])
      box(g, metal, xx, 0.15, 0, 0.055, 0.25, 0.65);
    for (const xx of [-0.83, 0, 0.83])
      box(g, fabric, xx, 0.64, 0.05, 0.78, 0.12, 0.79);
    for (const xx of [-0.88, 0.8])
      box(g, cushion, xx, 0.91, -0.22, 0.55, 0.46, 0.16, -0.12);
  }
  sofa(structure, 1.5, 0.64, 0.75);
  sofa(structure, 4.2, 0.64, 1.6, -Math.PI / 2);
  box(structure, rug, 2.1, 0.65, 1.45, 5.5, 0.018, 3.45);
  cylinder(structure, basalt, 2.1, 0.94, 2.2, 0.88, 0.12);
  cylinder(structure, brass, 2.1, 0.79, 2.2, 0.4, 0.3);
  box(structure, limestone, 2.02, 1.03, 2.2, 0.4, 0.045, 0.3, 0.2);
  cylinder(structure, teak, 2.45, 1.12, 2.2, 0.07, 0.26, 0.09);
  // Fireplace with shadowed niche, shelf, books and artwork.
  box(structure, travertine, -1.7, 1.9, -3.92, 2.3, 2.6, 0.46);
  box(structure, basalt, -1.7, 1.18, -3.65, 1.7, 0.55, 0.08);
  box(structure, warm, -1.7, 0.99, -3.59, 1.4, 0.035, 0.035);
  box(structure, metal, -1.7, 2.4, -3.65, 1.18, 1.04, 0.055);
  box(structure, rug, -1.7, 2.4, -3.61, 1.07, 0.93, 0.025);
  for (let i = 0; i < 6; i++)
    box(
      structure,
      i % 2 ? teak : fabric,
      -2.4 + i * 0.18,
      1.58,
      -3.5,
      0.1,
      0.23 + (i % 3) * 0.06,
      0.18,
    );
  box(structure, teak, 4.6, 1.47, -2.7, 2.8, 0.13, 1.2);
  for (const x of [3.6, 5.6])
    box(structure, metal, x, 1.06, -2.7, 0.06, 0.78, 0.7);
  for (let i = 0; i < 4; i++) {
    const x = 3.65 + (i % 2) * 1.85,
      z = -2.7 + (i < 2 ? -0.9 : 0.9);
    box(structure, fabric, x, 1.07, z, 0.6, 0.16, 0.6);
    box(
      structure,
      fabric,
      x,
      1.43,
      z + (i < 2 ? -0.24 : 0.24),
      0.6,
      0.65,
      0.12,
    );
    for (const dx of [-0.22, 0.22])
      box(structure, teak, x + dx, 0.84, z, 0.04, 0.4, 0.45);
  }
  cylinder(structure, brass, 4.6, 3.03, -2.7, 0.5, 0.09);
  box(structure, metal, 4.6, 3.24, -2.7, 0.02, 0.4, 0.02);
  cylinder(structure, warm, 4.6, 2.98, -2.7, 0.45, 0.018);
  // Upper suite and outdoor lounge.
  box(upper, teak, 0, 4.15, -1.05, 2.45, 0.23, 2.6);
  box(upper, fabric, 0, 4.42, -1.05, 2.36, 0.32, 2.5);
  box(upper, teak, 0, 4.77, -2.4, 2.7, 1.2, 0.16);
  box(upper, cushion, 0, 4.61, -0.45, 2.38, 0.06, 1.1);
  for (const x of [-0.6, 0.6])
    box(upper, fabric, x, 4.65, -1.95, 0.95, 0.15, 0.55);
  for (const x of [-1.85, 1.85]) {
    box(upper, teak, x, 4.37, -2.1, 0.62, 0.6, 0.6);
    cylinder(upper, brass, x, 4.87, -2.1, 0.035, 0.45);
    cylinder(upper, fabric, x, 5.12, -2.1, 0.22, 0.32, 0.12);
  }
  sofa(upper, 4.65, 3.98, 2.93);
  cylinder(upper, travertine, 4.65, 4.4, 3.85, 0.45, 0.09);
  // Outdoor loungers with timber frames, stitched cushions and side tables.
  for (const x of [-6.4, -3.9]) {
    box(terrace, teak, x, 0.31, 9.3, 1.1, 0.14, 1.7);
    box(terrace, fabric, x, 0.43, 9.3, 1.04, 0.14, 1.66);
    box(terrace, fabric, x, 0.63, 8.8, 1.04, 0.22, 0.6);
    for (const xx of [-0.43, 0.43])
      box(terrace, metal, x + xx, 0.17, 9.3, 0.045, 0.24, 1.35);
  }
  cylinder(terrace, travertine, -5.15, 0.35, 9.1, 0.33, 0.12);
  cylinder(terrace, metal, -5.15, 0.17, 9.1, 0.06, 0.3);
  // Sculptural, branching olive trees. Leaf cards are instanced, not stacked spheres.
  let randomState = 712;
  const rand = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState / 4294967296;
  };
  const leafGeometry = new T.PlaneGeometry(0.14, 0.045);
  geometries.add(leafGeometry);
  const treeCrowns: T.Group[] = [];
  function branch(group: T.Group, a: T.Vector3, b: T.Vector3, r: number) {
    const diff = b.clone().sub(a),
      g = new T.CylinderGeometry(r * 0.55, r, diff.length(), 7);
    g.applyQuaternion(
      new T.Quaternion().setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        diff.normalize(),
      ),
    );
    geometry(
      group,
      g,
      bark,
      a.clone().add(b).multiplyScalar(0.5).toArray() as [
        number,
        number,
        number,
      ],
    );
  }
  function olive(x: number, z: number, scale: number) {
    cylinder(planting, basalt, x, 0.25, z, 0.98, 0.36);
    cylinder(planting, travertine, x, 0.47, z, 0.88, 0.14);
    const base = new T.Vector3(x, 0.5, z),
      fork = new T.Vector3(x + 0.12, 2 * scale, z);
    branch(planting, base, fork, 0.105 * scale);
    const crown = new T.Group();
    planting.add(crown);
    crown.position.set(x, 0, z);
    treeCrowns.push(crown);
    for (let j = 0; j < 7; j++) {
      const angle = j * 2.399,
        tip = new T.Vector3(
          x + Math.cos(angle) * 1.08 * scale,
          (2.6 + rand() * 0.9) * scale,
          z + Math.sin(angle) * 1.08 * scale,
        );
      branch(planting, fork, tip, 0.045 * scale);
    }
    const count = lite ? 500 : 1100,
      leavesMesh = new T.InstancedMesh(leafGeometry, leaves, count),
      dummy = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2,
        r = Math.sqrt(rand()) * 1.55 * scale;
      dummy.position.set(
        Math.cos(a) * r,
        (2.9 + (rand() - 0.5) * 1.25) * scale,
        Math.sin(a) * r,
      );
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      dummy.scale.setScalar(0.8 + rand() * 0.85);
      dummy.updateMatrix();
      leavesMesh.setMatrixAt(i, dummy.matrix);
    }
    leavesMesh.castShadow = !lite;
    crown.add(leavesMesh);
  }
  olive(-9.2, 1.8, 1.15);
  olive(9.5, -2.3, 1.4);
  olive(9.4, 5.6, 1.1);
  for (const [x, z] of [
    [-8.9, -5.8],
    [9.5, -6.5],
  ]) {
    box(planting, basalt, x, 0.22, z, 1.8, 0.35, 2);
    for (let i = 0; i < 11; i++)
      sphere(
        planting,
        hedge,
        x + (rand() - 0.5) * 1.2,
        0.55 + rand() * 0.15,
        z + (rand() - 0.5) * 1.5,
        0.27,
        1,
        0.7,
        1,
      );
  }
  // Planting borders and warm path bollards.
  for (let i = 0; i < 17; i++) {
    const z = -7.5 + i * 0.9;
    for (const x of [-10.2, 10.4])
      sphere(planting, hedge, x, 0.31, z, 0.32, 0.9, 0.7, 1);
  }
  const grassMaterial = standard({
    color: "#71805a",
    roughness: 0.95,
    side: T.DoubleSide,
  });
  const bladeGeometry = new T.PlaneGeometry(0.075, 0.55, 1, 4);
  const positions = bladeGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const t = (positions.getY(i) + 0.275) / 0.55;
    positions.setXYZ(
      i,
      positions.getX(i) * (1 - t * 0.94),
      t * 0.55,
      t * t * 0.17,
    );
  }
  bladeGeometry.computeVertexNormals();
  geometries.add(bladeGeometry);
  const bladeCount = lite ? 480 : 1100;
  const meadow = new T.InstancedMesh(bladeGeometry, grassMaterial, bladeCount),
    bladeTransform = new T.Object3D();
  for (let i = 0; i < bladeCount; i++) {
    const x = i % 2 === 0 ? 9 + rand() * 1.75 : -10.15 + rand() * 0.65,
      z = -7.5 + rand() * 15;
    bladeTransform.position.set(x, 0.13, z);
    bladeTransform.rotation.set(
      (rand() - 0.5) * 0.3,
      rand() * Math.PI * 2,
      (rand() - 0.5) * 0.3,
    );
    bladeTransform.scale.setScalar(0.65 + rand() * 0.8);
    bladeTransform.updateMatrix();
    meadow.setMatrixAt(i, bladeTransform.matrix);
  }
  planting.add(meadow);
  for (const z of [-5, 0, 5, 8]) {
    box(planting, metal, 8.15, 0.38, z, 0.12, 0.66, 0.12);
    box(planting, warm, 8.15, 0.63, z + 0.065, 0.085, 0.06, 0.015);
  }
  // Flush recessed line at the water level, not a blue neon outline.
  box(terrace, warm, -3.7, 0.08, 4.74, 7.95, 0.018, 0.018);

  for (const [group, byMaterial] of batches)
    for (const [mat, parts] of byMaterial) {
      // Merge repeated details by material and reveal layer to limit draw calls.
      // All primitives above are indexed with matching position/normal/UV attributes.
      const merged = mergeGeometries(parts, false);
      parts.forEach((g) => g.dispose());
      if (!merged) continue;
      geometries.add(merged);
      const mesh = new T.Mesh(merged, mat);
      mesh.castShadow = mat !== glass && mat !== warm;
      mesh.receiveShadow = mat !== glass;
      group.add(mesh);
    }
  batches.clear();
  // A real planar reflection on desktop. Low-tier devices use the local IBL instead.
  let mirror: Reflector | undefined;
  let waterMaterial: T.ShaderMaterial | undefined;
  const waterTime = { value: 0 };
  if (!lite) {
    mirror = new Reflector(new T.PlaneGeometry(8.04, 3.69), {
      textureWidth: 512,
      textureHeight: 256,
      color: 0x507c80,
      clipBias: 0.004,
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.set(-3.7, 0.055, 6.65);
    waterMaterial = mirror.material as T.ShaderMaterial;
    waterMaterial.uniforms.uTime = waterTime;
    waterMaterial.fragmentShader = waterMaterial.fragmentShader
      .replace(
        "uniform vec3 color;",
        "uniform vec3 color;\nuniform float uTime;",
      )
      .replace(
        "vec4 base = texture2DProj( tDiffuse, vUv );",
        "vec4 rippleUv = vUv;\nrippleUv.x += sin(vUv.y * 28.0 + uTime * 0.7) * 0.0005 * vUv.w;\nrippleUv.y += cos(vUv.x * 21.0 + uTime * 0.55) * 0.00035 * vUv.w;\nvec4 base = texture2DProj( tDiffuse, rippleUv );\nbase.rgb = mix(vec3(0.065, 0.22, 0.23), base.rgb, 0.7);",
      );
    terrace.add(mirror);
    geometries.add(mirror.geometry);
    materials.add(waterMaterial);
  } else {
    const m = new T.MeshPhysicalMaterial({
      color: "#286465",
      metalness: 0.45,
      roughness: 0.14,
      clearcoat: 1,
      envMapIntensity: 1.5,
    });
    materials.add(m);
    const g = new T.PlaneGeometry(8.04, 3.69);
    geometries.add(g);
    const water = new T.Mesh(g, m);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-3.7, 0.055, 6.65);
    terrace.add(water);
  }
  // Small soft contact patches supplement directional shadows under the entire villa.
  const contactCanvas = document.createElement("canvas");
  contactCanvas.width = contactCanvas.height = 128;
  const cc = contactCanvas.getContext("2d")!,
    gradient = cc.createRadialGradient(64, 64, 12, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,0.5)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  cc.fillStyle = gradient;
  cc.fillRect(0, 0, 128, 128);
  const contactTexture = new T.CanvasTexture(contactCanvas);
  textures.push(contactTexture);
  const contactMaterial = new T.MeshBasicMaterial({
    map: contactTexture,
    transparent: true,
    depthWrite: false,
  });
  materials.add(contactMaterial);
  const contactGeometry = new T.PlaneGeometry(30, 27);
  geometries.add(contactGeometry);
  const contact = new T.Mesh(contactGeometry, contactMaterial);
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, -0.965, 1);
  scene.add(contact);
  const groundMaterial = standard({ color: "#0b1725", roughness: 0.9 });
  const groundGeometry = new T.PlaneGeometry(200, 200);
  geometries.add(groundGeometry);
  const ground = new T.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.98;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(new T.HemisphereLight("#a8c5e8", "#66563b", 0.8));
  const sun = new T.DirectionalLight("#ffd397", 2.8);
  sun.position.set(-8, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lite ? 512 : 1024, lite ? 512 : 1024);
  Object.assign(sun.shadow.camera, {
    left: -18,
    right: 18,
    top: 16,
    bottom: -16,
    near: 0.5,
    far: 50,
  });
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.00025;
  sun.shadow.radius = 3;
  scene.add(sun);
  const rim = new T.DirectionalLight("#9bbcea", 1.1);
  rim.position.set(8, 8, -6);
  scene.add(rim);
  for (const [x, y, z, power] of [
    [1.5, 2.9, 0, 65],
    [4.5, 2.9, -2.5, 50],
    [1, 6, -0.5, 50],
    [-4.5, 2.7, 2.7, 20],
  ]) {
    const light = new T.PointLight("#ffd395", power, 8, 2);
    light.position.set(x, y, z);
    scene.add(light);
  }

  const revealLayers = [
    { g: structure, delay: 0.4, offset: 1.1 },
    { g: upper, delay: 1.7, offset: 1.9 },
    { g: screens, delay: 3.6, offset: 0.9 },
  ];
  const tour = new T.CatmullRomCurve3(
    [
      new T.Vector3(20, 10.5, 26),
      new T.Vector3(12, 8.3, 30),
      new T.Vector3(0, 7.7, 31),
      new T.Vector3(-14, 9.3, 28),
      new T.Vector3(8, 13, 30),
    ],
    true,
    "catmullrom",
    0.35,
  );
  const framingTarget = new T.Vector3(0, 2.3, 1.2);
  const initial = new T.Vector3(26, 14, 32);
  const desired = new T.Vector3();
  const presetPosition = new T.Vector3();
  let presetName = "Perspective",
    touring = true,
    paused = false,
    interacting = false,
    disposed = false,
    visible = true;
  let timeline = options.reduced ? 9 : 0,
    elapsed = 0,
    renderedFrames = 0,
    frame = 0,
    last = 0,
    idleUntil = 0,
    transitioning = false,
    dirty = 2;
  let firstShadow = true;
  let covered = false;
  const zoomOffset = { value: 1 };
  function frameScale() {
    return mobile ? 1.35 : camera.aspect < 1.05 ? 1.18 : 1;
  }
  camera.position
    .copy(options.reduced ? tour.getPoint(0) : initial)
    .multiplyScalar(frameScale());
  controls.target.copy(framingTarget);
  controls.update();
  camera.zoom = Math.min(1, camera.aspect / 0.95);
  camera.updateProjectionMatrix();
  const resize = () => {
    if (!host.clientWidth || !host.clientHeight) return;
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.zoom = Math.min(1, camera.aspect / 0.95);
    camera.updateProjectionMatrix();
    dirty = 2;
    last = 0;
    start();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const requestRender = () => {
    dirty = 30;
    start();
  };
  const startInteraction = () => {
    interacting = true;
    touring = false;
    transitioning = false;
    idleUntil = elapsed + 14;
    requestRender();
  };
  const endInteraction = () => {
    interacting = false;
    idleUntil = elapsed + 14;
    requestRender();
  };
  controls.addEventListener("start", startInteraction);
  controls.addEventListener("end", endInteraction);
  controls.addEventListener("change", () => {
    dirty = Math.max(dirty, 2);
  });
  const keyboard = (event: KeyboardEvent) => {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "-"].includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    touring = false;
    transitioning = false;
    if (event.key === "+" || event.key === "-")
      zoom(event.key === "+" ? 0.9 : 1.1);
    else {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new T.Spherical().setFromVector3(offset);
      if (event.key === "ArrowLeft" || event.key === "ArrowRight")
        spherical.theta += event.key === "ArrowLeft" ? -0.1 : 0.1;
      else
        spherical.phi = T.MathUtils.clamp(
          spherical.phi + (event.key === "ArrowUp" ? -0.08 : 0.08),
          0.45,
          1.47,
        );
      camera.position
        .copy(controls.target)
        .add(offset.setFromSpherical(spherical));
      controls.update();
      requestRender();
    }
  };
  canvas.addEventListener("keydown", keyboard);
  const contextLost = (event: Event) => {
    event.preventDefault();
    pause(true);
    host.dispatchEvent(new Event("villa-context-lost"));
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      last = 0;
      if (visible) start();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { rootMargin: "100px" },
  );
  io.observe(host);
  // The navigation is an opaque foreground task: leave its interactions the GPU budget.
  const navigation = document.querySelector(".header");
  const menuObserver = new MutationObserver(() => {
    covered = !!document.querySelector(
      '.premium-navigation.open, .mega-trigger[aria-expanded="true"]',
    );
    last = 0;
    if (covered) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else start();
  });
  if (navigation)
    menuObserver.observe(navigation, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded", "class"],
    });
  const visibility = () => {
    last = 0;
    if (!document.hidden) start();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
  document.addEventListener("visibilitychange", visibility);
  function tick(time: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || covered) return;
    // Render at 30fps; animation advances in seconds, independently of refresh rate.
    if (last && time - last < 32) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const dt = last ? Math.min((time - last) / 1000, 0.25) : 1 / 30;
    last = time;
    const animate = !paused && !options.reduced;
    if (animate) {
      timeline += dt;
      elapsed += dt;
    }
    for (const { g, delay, offset } of revealLayers) {
      const amount = smooth((timeline - delay) / 2.3);
      g.position.y = (1 - amount) * offset;
      g.scale.y = Math.max(0.001, amount);
      g.visible = amount > 0.001;
    }
    if (animate && !interacting) {
      if (
        !touring &&
        !transitioning &&
        elapsed > idleUntil &&
        presetName === "Perspective"
      )
        touring = true;
      if (touring) {
        const intro = smooth(timeline / 7);
        tour.getPoint((Math.max(0, timeline - 7) % 64) / 64, desired);
        desired
          .lerpVectors(initial, desired, intro)
          .multiplyScalar(frameScale() * zoomOffset.value);
        camera.position.lerp(desired, 1 - Math.exp(-dt * 1.8));
      } else if (transitioning) {
        camera.position.lerp(presetPosition, 1 - Math.exp(-dt * 2.5));
        if (camera.position.distanceTo(presetPosition) < 0.015)
          transitioning = false;
      }
    } else if (transitioning && !interacting) {
      camera.position.lerp(presetPosition, 0.13);
      if (camera.position.distanceTo(presetPosition) < 0.015)
        transitioning = false;
    }
    if (animate) {
      waterTime.value = elapsed;
      treeCrowns.forEach((g, i) => {
        g.rotation.z = Math.sin(elapsed * 0.55 + i) * 0.008;
      });
    }
    controls.update();
    // Freeze shadow maps once the introductory assembly has settled.
    renderer.shadowMap.autoUpdate = timeline < 7;
    if (timeline < 7 || firstShadow) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    firstShadow = false;
    host.dataset.villaTime = timeline.toFixed(2);
    host.dataset.villaFrame = String(++renderedFrames);
    host.dataset.villaDrawCalls = String(renderer.info.render.calls);
    host.dataset.villaTriangles = String(renderer.info.render.triangles);
    dirty = Math.max(0, dirty - 1);
    if (animate || dirty > 0 || transitioning || interacting)
      frame = requestAnimationFrame(tick);
  }
  function start() {
    if (!frame && !disposed && visible && !document.hidden && !covered)
      frame = requestAnimationFrame(tick);
  }
  function zoom(factor: number) {
    touring = false;
    transitioning = true;
    idleUntil = elapsed + 14;
    presetPosition
      .copy(camera.position)
      .sub(controls.target)
      .multiplyScalar(factor)
      .clampLength(17, mobile ? 60 : 50)
      .add(controls.target);
    if (options.reduced) {
      camera.position.copy(presetPosition);
      controls.update();
      transitioning = false;
      dirty = 2;
      start();
    } else requestRender();
  }
  function pause(value: boolean) {
    paused = value;
    last = 0;
    dirty = 2;
    start();
  }
  start();
  return {
    preset(name) {
      presetName = name;
      zoomOffset.value = 1;
      touring = name === "Perspective" && !options.reduced && !paused;
      transitioning = !touring;
      idleUntil = elapsed + 14;
      presetPosition
        .set(
          ...((name === "Elevation"
            ? [0, 6.5, 32]
            : name === "Courtyard"
              ? [-20, 9, 25]
              : [20, 10.5, 26]) as [number, number, number]),
        )
        .multiplyScalar(frameScale());
      if (options.reduced) {
        camera.position.copy(presetPosition);
        controls.update();
        transitioning = false;
        dirty = 2;
        start();
      } else requestRender();
    },
    zoom,
    pause,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      menuObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("keydown", keyboard);
      canvas.removeEventListener("webglcontextlost", contextLost);
      controls.removeEventListener("start", startInteraction);
      controls.removeEventListener("end", endInteraction);
      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      mirror?.getRenderTarget().dispose();
      env.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
