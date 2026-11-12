import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Sparkles, Stars, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Hotspot } from "@/lib/mock-data";
import { ATMO_FRAG, ATMO_VERT, EARTH_FRAG, EARTH_VERT } from "./earth-shaders";
import { POSES, samplePose, type Pose } from "./poses";
import { sceneInput, selection } from "./store";
import { useTheme } from "@/lib/theme";

const R = 1.5; // earth radius (world units)
const TEX = {
  day: "/textures/earth-blue-marble.jpg",
  night: "/textures/earth-night.jpg",
  water: "/textures/earth-water.png",
};
const POSE_KEYS = Object.keys(POSES.overview) as (keyof Pose)[];
const DEG = Math.PI / 180;

/** Matches three's SphereGeometry UV mapping (prime meridian at +x). */
function latLngToVec3(lat: number, lng: number, radius: number, out = new THREE.Vector3()) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return out.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function aqiHex(aqi: number): string {
  if (aqi <= 50) return "#5fd68a";
  if (aqi <= 100) return "#e9d65c";
  if (aqi <= 150) return "#f0955a";
  return "#ee5a4c";
}

/** Equirectangular heat texture painted from the (demo) hotspot data. */
function buildHeatTexture(hotspots: Hotspot[]): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.globalCompositeOperation = "lighter";
  for (const h of hotspots) {
    const x = ((h.lng + 180) / 360) * W;
    const y = ((90 - h.lat) / 180) * H;
    const rad = 38 + (h.aqi / 300) * 46;
    const col = aqiHex(h.aqi);
    const a = Math.min(1, 0.25 + h.aqi / 260);
    for (const dx of [-W, 0, W]) {
      const grad = g.createRadialGradient(x + dx, y, 0, x + dx, y, rad);
      grad.addColorStop(0, hexA(col, a));
      grad.addColorStop(0.5, hexA(col, a * 0.35));
      grad.addColorStop(1, hexA(col, 0));
      g.fillStyle = grad;
      g.fillRect(x + dx - rad, y - rad, rad * 2, rad * 2);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

type LiveRef = React.MutableRefObject<Pose>;

/* ------------------------------------------------------------------ Earth */

function Earth({ hotspots, live }: { hotspots: Hotspot[]; live: LiveRef }) {
  const [day, night, water] = useTexture([TEX.day, TEX.night, TEX.water]);
  const gl = useThree((s) => s.gl);
  const heatTex = useMemo(() => buildHeatTexture(hotspots), [hotspots]);

  const earthMat = useMemo(() => {
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    day.colorSpace = THREE.SRGBColorSpace;
    night.colorSpace = THREE.SRGBColorSpace;
    for (const t of [day, night, water]) t.anisotropy = aniso;
    return new THREE.ShaderMaterial({
      vertexShader: EARTH_VERT,
      fragmentShader: EARTH_FRAG,
      uniforms: {
        dayMap: { value: day },
        nightMap: { value: night },
        waterMap: { value: water },
        heatMap: { value: heatTex },
        sunDir: { value: new THREE.Vector3(1, 0.3, 1) },
        nightBias: { value: 0 },
        heat: { value: 0 },
        dim: { value: 1 },
      },
    });
  }, [day, night, water, heatTex, gl]);

  const atmoMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ATMO_VERT,
        fragmentShader: ATMO_FRAG,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          sunDir: { value: new THREE.Vector3(1, 0.3, 1) },
          dim: { value: 1 },
          inner: { value: 1 / 1.16 },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      earthMat.dispose();
      heatTex.dispose();
    },
    [earthMat, heatTex],
  );
  useEffect(() => () => atmoMat.dispose(), [atmoMat]);

  // Additive glow vanishes on a light page: use normal blending there.
  const theme = useTheme();
  useEffect(() => {
    atmoMat.blending = theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
    atmoMat.needsUpdate = true;
  }, [theme, atmoMat]);

  const sun = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const p = live.current;
    const az = p.sun * DEG;
    sun.set(Math.sin(az) * 0.94, 0.34, Math.cos(az) * 0.94);
    const u = earthMat.uniforms;
    (u.sunDir.value as THREE.Vector3).copy(sun);
    u.nightBias.value = p.night;
    const heatLayer = selection.get().layer === "heat" ? p.follow * 0.9 : 0;
    u.heat.value = Math.max(p.heat, heatLayer);
    u.dim.value = p.dim;
    (atmoMat.uniforms.sunDir.value as THREE.Vector3).copy(sun);
    atmoMat.uniforms.dim.value = p.dim;
  });

  const swallow = (e: ThreeEvent<MouseEvent>) => e.stopPropagation(); // occlude markers behind the planet
  return (
    <>
      <mesh material={earthMat} onClick={swallow}>
        <sphereGeometry args={[R, 96, 96]} />
      </mesh>
      <mesh material={atmoMat} scale={1.16}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>
    </>
  );
}

/* ---------------------------------------------------------------- Markers */

function Marker({ h, live }: { h: Hotspot; live: LiveRef }) {
  const group = useRef<THREE.Group>(null);
  const stalk = useRef<THREE.Mesh>(null);
  const tip = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  const { pos, quat, color, height } = useMemo(() => {
    const pos = latLngToVec3(h.lat, h.lng, R);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      pos.clone().normalize(),
    );
    return { pos, quat, color: new THREE.Color(aqiHex(h.aqi)), height: 0.05 + (h.aqi / 300) * 0.4 };
  }, [h]);
  const phase = Number(h.id) * 0.37;

  useFrame(({ clock }) => {
    const p = live.current;
    const isSel = selection.get().selectedId === h.id;
    const t = clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    g.visible = p.markers > 0.01;
    g.scale.setScalar(Math.max(0.0001, p.markers));
    const cols = p.columns * (selection.get().layer === "heat" ? 0.3 : 1);
    const hh = 0.001 + height * cols;
    if (stalk.current) {
      stalk.current.scale.y = hh;
      stalk.current.position.y = hh / 2;
    }
    if (tip.current) {
      tip.current.position.y = hh;
      tip.current.scale.setScalar(isSel ? 1.9 : 1);
    }
    if (ring.current && ringMat.current) {
      const f = sceneInput.reducedMotion ? 0.4 : (t * 0.45 + phase) % 1;
      ring.current.scale.setScalar(isSel ? 2.6 + f * 1.4 : 1 + f * 2.4);
      ringMat.current.opacity = (1 - f) * (isSel ? 0.9 : 0.55);
      ring.current.position.y = 0.004;
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const target = e.nativeEvent.target as HTMLElement | null;
    if (live.current.follow < 0.6 || !target?.closest("[data-globe-zone]")) return;
    selection.set({ selectedId: h.id });
  };
  const over = (on: boolean) => {
    if (live.current.follow > 0.6) document.body.style.cursor = on ? "pointer" : "";
  };

  return (
    <group ref={group} position={pos} quaternion={quat}>
      <mesh ref={stalk}>
        <cylinderGeometry args={[0.006, 0.01, 1, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh ref={tip}>
        <sphereGeometry args={[0.024, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.038, 40]} />
        <meshBasicMaterial
          ref={ringMat}
          color={color}
          transparent
          opacity={0.5}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* generous invisible hit target */}
      <mesh onClick={onClick} onPointerOver={() => over(true)} onPointerOut={() => over(false)}>
        <sphereGeometry args={[0.075, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------- Arcs */

const ARC_PAIRS: [string, string][] = [
  ["1", "4"],
  ["2", "7"],
  ["4", "11"],
  ["10", "4"],
  ["9", "12"],
  ["5", "3"],
];

function Arcs({ hotspots, live }: { hotspots: Hotspot[]; live: LiveRef }) {
  const arcs = useMemo(() => {
    const byId = new Map(hotspots.map((h) => [h.id, h]));
    return ARC_PAIRS.flatMap(([a, b]) => {
      const A = byId.get(a);
      const B = byId.get(b);
      if (!A || !B) return [];
      const va = latLngToVec3(A.lat, A.lng, 1).normalize();
      const vb = latLngToVec3(B.lat, B.lng, 1).normalize();
      const ang = va.angleTo(vb);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const v = new THREE.Vector3().copy(va).lerp(vb, t).normalize();
        pts.push(v.multiplyScalar(R * (1.01 + Math.sin(Math.PI * t) * (0.1 + ang * 0.16))));
      }
      const mat = new THREE.LineBasicMaterial({
        color: "#b8f06a",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
      return [{ line, mat, pts }];
    });
  }, [hotspots]);

  const dots = useRef<(THREE.Mesh | null)[]>([]);
  useEffect(
    () => () =>
      arcs.forEach((a) => {
        a.line.geometry.dispose();
        a.mat.dispose();
      }),
    [arcs],
  );

  useFrame(({ clock }) => {
    const k = live.current.arcs;
    arcs.forEach((a, i) => {
      a.mat.opacity = 0.55 * k;
      a.line.visible = k > 0.01;
      const d = dots.current[i];
      if (d) {
        d.visible = k > 0.02;
        const f = sceneInput.reducedMotion ? 0.5 : (clock.elapsedTime * 0.14 + i * 0.17) % 1;
        d.position.copy(a.pts[Math.floor(f * 64)]);
        d.scale.setScalar(Math.max(0.001, k));
      }
    });
  });

  return (
    <>
      {arcs.map((a, i) => (
        <group key={i}>
          <primitive object={a.line} />
          <mesh
            ref={(m) => {
              dots.current[i] = m;
            }}
          >
            <sphereGeometry args={[0.016, 10, 10]} />
            <meshBasicMaterial color="#e6ffb0" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- Driver */

function Driver({
  live,
  earth,
  tilt,
  hotspots,
  onVisible,
}: {
  live: LiveRef;
  earth: React.RefObject<THREE.Group | null>;
  tilt: React.RefObject<THREE.Group | null>;
  hotspots: Hotspot[];
  onVisible: (v: boolean) => void;
}) {
  const camera = useThree((s) => s.camera);
  const target = useRef<Pose>({ ...POSES.overview });
  const accum = useRef(0); // idle spin, degrees
  const visible = useRef(true);
  const hold = useRef(0); // 1 while the user holds the planet; idle spin yields to it
  const lastScroll = useRef(0);
  const lastSel = useRef<string | null>(null);
  const resetT = useRef(0);
  const cam = useMemo(() => new THREE.Vector3(), []);
  const v1 = useMemo(() => new THREE.Vector3(), []);
  const v2 = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const narrow = sceneInput.viewportW < 768;
    const reduced = sceneInput.reducedMotion;
    const tg = samplePose(target.current, narrow);
    const cur = live.current;

    // follow the selected location (Live Earth)
    const sel = hotspots.find((h) => h.id === selection.get().selectedId);
    const baseLon = sel ? sel.lng : 10;
    const baseLat = sel ? sel.lat * 0.8 : 20;
    const f = tg.follow;
    let lonT = tg.lon + (baseLon - tg.lon) * f;
    const latT = tg.lat + (baseLat - tg.lat) * f;
    // shortest rotational path
    while (lonT - cur.lon > 180) lonT -= 360;
    while (lonT - cur.lon < -180) lonT += 360;
    tg.lon = lonT;
    tg.lat = latT;

    const lam = reduced ? 60 : 3.2;
    for (const k of POSE_KEYS) cur[k] = THREE.MathUtils.damp(cur[k], tg[k], lam, dt);

    // idle spin (decays back when a section wants a still planet)
    if (!reduced) {
      hold.current = THREE.MathUtils.damp(
        hold.current,
        sceneInput.dragging ? 1 : 0,
        sceneInput.dragging ? 18 : 0.9,
        dt,
      );
      accum.current += dt * 2.6 * cur.spin * (1 - hold.current);
      accum.current *= 1 - Math.min(1, dt * (1 - Math.min(1, cur.spin * 2)) * 0.7);
      if (cur.follow < 0.01 && Math.abs(accum.current) > 180)
        accum.current -= 360 * Math.sign(accum.current);
    }

    // Manual rotation. It rides on top of the scroll pose: it persists while the reader stays put,
    // is absorbed as they scroll toward the next section, and is cleared when they pick a city.
    const ds = Math.abs(sceneInput.scrollY - lastScroll.current);
    lastScroll.current = sceneInput.scrollY;
    const selId = selection.get().selectedId;
    if (selId !== lastSel.current) {
      lastSel.current = selId;
      resetT.current = 1.2;
    }
    if (!sceneInput.dragging) {
      // inertia: glide, then settle
      sceneInput.dragYaw += sceneInput.dragVelYaw * dt;
      sceneInput.dragPitch = THREE.MathUtils.clamp(
        sceneInput.dragPitch + sceneInput.dragVelPitch * dt,
        -1.1,
        1.1,
      );
      const friction = Math.exp(-dt * 3.2);
      sceneInput.dragVelYaw *= friction;
      sceneInput.dragVelPitch *= friction;
      if (Math.abs(sceneInput.dragVelYaw) < 0.002) sceneInput.dragVelYaw = 0;
      if (Math.abs(sceneInput.dragVelPitch) < 0.002) sceneInput.dragVelPitch = 0;
      // scrolling carries the user toward the next pose: absorb the manual offset
      const absorb = Math.exp(-ds * 0.0035) * (resetT.current > 0 ? Math.exp(-dt * 5) : 1);
      sceneInput.dragYaw *= absorb;
      sceneInput.dragPitch *= absorb;
      if (resetT.current > 0) {
        resetT.current -= dt;
        sceneInput.dragVelYaw = 0;
        sceneInput.dragVelPitch = 0;
      }
    }
    // keep the unwrapped yaw bounded without a visible jump (a full turn is the same view)
    if (Math.abs(sceneInput.dragYaw) > Math.PI * 2)
      sceneInput.dragYaw -= Math.PI * 2 * Math.sign(sceneInput.dragYaw);

    const lon = cur.lon + accum.current * (1 - cur.follow) + sceneInput.dragYaw / DEG;
    const lat = THREE.MathUtils.clamp(cur.lat + sceneInput.dragPitch / DEG, -70, 70);
    if (earth.current) {
      earth.current.rotation.y = -(lon + 90) * DEG;
    }
    if (tilt.current) {
      tilt.current.rotation.x = lat * DEG;
      tilt.current.position.set(cur.x, cur.y, 0);
    }

    // camera with pointer parallax
    const px = reduced ? 0 : sceneInput.pointerX;
    const py = reduced ? 0 : sceneInput.pointerY;
    cam.set(px * 0.32, py * 0.18, cur.z);
    camera.position.lerp(cam, Math.min(1, dt * 3));
    camera.lookAt(0, 0, 0);

    // Publish the planet's on-screen disc so the DOM can hit-test drags against it.
    camera.updateMatrixWorld();
    const { width: W, height: H } = state.size;
    v1.set(cur.x, cur.y, 0);
    const dist = camera.position.distanceTo(v1);
    v1.project(camera);
    v2.set(1, 0, 0)
      .transformDirection(camera.matrixWorld)
      .multiplyScalar(R)
      .add(v1.set(cur.x, cur.y, 0));
    v2.project(camera);
    v1.set(cur.x, cur.y, 0).project(camera);
    const e = sceneInput.earth;
    e.cx = ((v1.x + 1) / 2) * W;
    e.cy = ((1 - v1.y) / 2) * H;
    const flat = Math.hypot(((v2.x - v1.x) / 2) * W, ((v2.y - v1.y) / 2) * H);
    e.r = flat * (dist / Math.sqrt(Math.max(1e-3, dist * dist - R * R)));
    e.active = cur.dim > 0.25;

    const v = cur.dim > 0.04;
    if (v !== visible.current) {
      visible.current = v;
      onVisible(v);
    }
  });
  return null;
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

/* ------------------------------------------------------------------ Scene */

export interface EarthSceneProps {
  hotspots: Hotspot[];
  eventSource: HTMLElement | null;
  onReady: () => void;
  onLost: () => void;
  paused: boolean;
  onVisible: (v: boolean) => void;
}

export default function EarthScene({
  hotspots,
  eventSource,
  onReady,
  onLost,
  paused,
  onVisible,
}: EarthSceneProps) {
  const live = useRef<Pose>({ ...POSES.overview });
  const tilt = useRef<THREE.Group>(null);
  const earth = useRef<THREE.Group>(null);
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Canvas
      className="!fixed inset-0 z-0"
      style={{ position: "fixed", inset: 0 }}
      camera={{ position: [0, 0, 5.4], fov: 38, near: 0.1, far: 120 }}
      dpr={[1, mobile ? 1.5 : 1.8]}
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
      eventSource={eventSource ?? undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost();
        });
      }}
    >
      <Driver live={live} earth={earth} tilt={tilt} hotspots={hotspots} onVisible={onVisible} />
      <Stars radius={60} depth={50} count={mobile ? 900 : 2200} factor={3.2} fade speed={0.3} />
      <Sparkles
        count={mobile ? 40 : 110}
        scale={[14, 8, 6]}
        size={2.2}
        speed={0.25}
        opacity={0.5}
        color="#c6f26e"
      />
      <Suspense fallback={null}>
        <group>
          <group ref={tilt}>
            <group ref={earth}>
              <Earth hotspots={hotspots} live={live} />
              {hotspots.map((h) => (
                <Marker key={h.id} h={h} live={live} />
              ))}
              <Arcs hotspots={hotspots} live={live} />
            </group>
          </group>
        </group>
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
