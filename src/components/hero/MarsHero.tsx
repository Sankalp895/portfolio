import { useEffect, useRef, useState } from 'react';
import type * as ThreeNS from 'three';

// Three.js is imported dynamically below, so phones and reduced-motion visitors
// never download it. They get the static poster instead.

/**
 * The Mars hero. This is an illustration of the SkyScout idea, drawn in the browser.
 * It is not simulator output, and it is labelled as such on the page.
 * Terrain is generated from seed 20260808, the same seed the real SkyScout world uses.
 */

const SEED = 20260808;
const TERRAIN_M = 80; // 80 x 80 m, matching SkyScout
const SEGMENTS = 72;
const GRID = 24; // hazard mini-map resolution

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Height field: a few octaves, one crater, one ridge. Deterministic for a given seed. */
function makeHeightField(seed: number) {
  const rnd = mulberry32(seed);
  const octaves = Array.from({ length: 4 }, (_, i) => ({
    fx: (0.06 + rnd() * 0.05) * (i + 1),
    fy: (0.06 + rnd() * 0.05) * (i + 1),
    px: rnd() * Math.PI * 2,
    py: rnd() * Math.PI * 2,
    amp: 1.9 / (i + 1.35),
  }));

  const crater = { x: -12 + rnd() * 8, y: 9 - rnd() * 8, r: 13 + rnd() * 4, depth: 3.4 };
  const ridgeAngle = rnd() * Math.PI;

  return function height(x: number, y: number) {
    let h = 0;
    for (const o of octaves) h += Math.sin(x * o.fx + o.px) * Math.cos(y * o.fy + o.py) * o.amp;

    // Ridge: a raised band running across the map.
    const t = x * Math.cos(ridgeAngle) + y * Math.sin(ridgeAngle);
    h += Math.exp(-((t - 6) * (t - 6)) / 150) * 2.6;

    // Crater: a rim that lifts, a bowl that drops.
    const d = Math.hypot(x - crater.x, y - crater.y);
    if (d < crater.r * 1.5) {
      const rim = Math.exp(-((d - crater.r) * (d - crater.r)) / 12) * 1.7;
      const bowl = d < crater.r ? -crater.depth * Math.cos((d / crater.r) * Math.PI * 0.5) : 0;
      h += rim + bowl;
    }
    return h;
  };
}

/** Lawnmower survey path over the terrain, the pattern SkyScout flies. */
function surveyPath(THREE: typeof ThreeNS, legs = 7) {
  const pts: ThreeNS.Vector3[] = [];
  const half = TERRAIN_M / 2 - 7;
  const step = (half * 2) / (legs - 1);
  for (let i = 0; i < legs; i++) {
    const y = -half + i * step;
    const a = i % 2 === 0 ? -half : half;
    const b = i % 2 === 0 ? half : -half;
    pts.push(new THREE.Vector3(a, 0, y), new THREE.Vector3(b, 0, y));
  }
  return pts;
}

type Mode = 'truth' | 'estimate';

export default function MarsHero() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<Mode>('truth');
  const [mode, setMode] = useState<Mode>('truth');
  // Starts false so the server renders the static poster. The 3D only switches on
  // once we know the device should run it.
  const [enabled, setEnabled] = useState(false);
  // Until the first effect runs we do not know which view this device gets, so the
  // poster stays unlabelled and the label never flashes on a desktop.
  const [decided, setDecided] = useState(false);
  const [readout, setReadout] = useState({ alt: 0, drift: 0, mapped: 0 });

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 760;
    if (!reduced && !small) setEnabled(true);
    setDecided(true);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let teardown = () => {};

    (async () => {
      const THREE = await import('three');
      if (cancelled) return;

      const mount = mountRef.current;
      const mapCanvas = mapRef.current;
      if (!mount || !mapCanvas) return;

      let renderer: ThreeNS.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
      } catch {
        setEnabled(false);
        return;
      }

      const width = mount.clientWidth;
    const height = mount.clientHeight;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0d12, 0.0125);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 320);
    camera.position.set(0, 52, 48);
    camera.lookAt(0, 2, 0);

    const height2d = makeHeightField(SEED);

    // Terrain, low poly and flat shaded so the facets read as a HUD surface.
    const geo = new THREE.PlaneGeometry(TERRAIN_M, TERRAIN_M, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as ThreeNS.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const lo = new THREE.Color(0x4a2418);
    const hi = new THREE.Color(0xc2643a);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = height2d(x, z);
      pos.setY(i, h);
      const t = THREE.MathUtils.clamp((h + 4) / 8, 0, 1);
      const c = lo.clone().lerp(hi, t * t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrain = new THREE.Mesh(
      geo,
      new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })
    );
    scene.add(terrain);

    // Wireframe overlay: the map as the drone sees it.
    const wire = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: 0xd9582b, wireframe: true, transparent: true, opacity: 0.07 })
    );
    wire.position.y = 0.05;
    scene.add(wire);

    // Boulders, instanced so they cost one draw call.
    const rnd = mulberry32(SEED + 7);
    const COUNT = 44;
    const boulders = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.MeshLambertMaterial({ color: 0x8a4a30, flatShading: true }),
      COUNT
    );
    const dummy = new THREE.Object3D();
    const hazards: { x: number; z: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const x = (rnd() - 0.5) * (TERRAIN_M - 8);
      const z = (rnd() - 0.5) * (TERRAIN_M - 8);
      const s = 0.5 + rnd() * 1.5;
      dummy.position.set(x, height2d(x, z) + s * 0.4, z);
      dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      boulders.setMatrixAt(i, dummy.matrix);
      if (s > 0.95) hazards.push({ x, z });
    }
    scene.add(boulders);

    // Survey path.
    const path = surveyPath(THREE);
    const pathLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(path.map((p) => new THREE.Vector3(p.x, height2d(p.x, p.z) + 9, p.z))),
      new THREE.LineBasicMaterial({ color: 0xd9582b, transparent: true, opacity: 0.5 })
    );
    scene.add(pathLine);

    // Drone: a body, an arm cross, four rotor rings.
    function makeDrone(ghost: boolean) {
      const g = new THREE.Group();
      const mat = new THREE.MeshLambertMaterial({
        color: ghost ? 0x8a8f9c : 0xe6e3da,
        transparent: ghost,
        opacity: ghost ? 0.45 : 1,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), mat);
      g.add(body);
      for (const [dx, dz] of [
        [1.2, 1.2],
        [-1.2, 1.2],
        [1.2, -1.2],
        [-1.2, -1.2],
      ]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), mat);
        arm.position.set(dx * 0.6, 0, dz * 0.6);
        arm.scale.set(5, 1, 5);
        g.add(arm);
        const rotor = new THREE.Mesh(
          new THREE.TorusGeometry(0.62, 0.05, 4, 12),
          new THREE.MeshBasicMaterial({
            color: ghost ? 0x8a8f9c : 0xd9582b,
            transparent: true,
            opacity: ghost ? 0.4 : 0.85,
          })
        );
        rotor.rotation.x = Math.PI / 2;
        rotor.position.set(dx, 0.2, dz);
        g.add(rotor);
      }
      return g;
    }

    const drone = makeDrone(false);
    const ghost = makeDrone(true);
    drone.scale.setScalar(2.4);
    ghost.scale.setScalar(2.4);
    ghost.visible = false;
    scene.add(drone, ghost);

    // The line between where the drone is and where it thinks it is.
    const driftGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const driftLine = new THREE.Line(
      driftGeo,
      new THREE.LineBasicMaterial({ color: 0xf2b84b, transparent: true, opacity: 0.8 })
    );
    driftLine.visible = false;
    scene.add(driftLine);

    // A downward scan cone, so it reads as a sensor and not a toy.
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(6, 9, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xd9582b, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
    );
    cone.rotation.x = Math.PI;
    scene.add(cone);

    scene.add(new THREE.HemisphereLight(0xffd9b8, 0x2a1a14, 1.15));
    const sun = new THREE.DirectionalLight(0xffb37a, 1.5);
    sun.position.set(-30, 40, 18);
    scene.add(sun);

    // Hazard mini-map, drawn on a plain 2D canvas as the drone covers ground.
    const ctx = mapCanvas.getContext('2d');
    const cell = new Float32Array(GRID * GRID);
    const mapPx = 168;
    mapCanvas.width = mapPx;
    mapCanvas.height = mapPx;
    const cellPx = mapPx / GRID;

    function paintCell(ix: number, iz: number) {
      if (!ctx) return;
      const v = cell[iz * GRID + ix];
      if (v <= 0) return;
      // Log-odds style shading: rust for hazard, dim slate for clear.
      ctx.fillStyle = v > 1.5 ? 'rgba(217, 88, 43, 0.88)' : 'rgba(138, 143, 156, 0.36)';
      ctx.fillRect(ix * cellPx, iz * cellPx, cellPx - 1, cellPx - 1);
    }

    let mapped = 0;
    function observe(wx: number, wz: number) {
      const ix = Math.floor(((wx + TERRAIN_M / 2) / TERRAIN_M) * GRID);
      const iz = Math.floor(((wz + TERRAIN_M / 2) / TERRAIN_M) * GRID);
      const r = 2;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = ix + dx;
          const z = iz + dz;
          if (x < 0 || z < 0 || x >= GRID || z >= GRID) continue;
          if (dx * dx + dz * dz > r * r) continue;
          const idx = z * GRID + x;
          if (cell[idx] === 0) mapped++;
          const cx = ((x + 0.5) / GRID) * TERRAIN_M - TERRAIN_M / 2;
          const cz = ((z + 0.5) / GRID) * TERRAIN_M - TERRAIN_M / 2;
          const near = hazards.some((h) => Math.hypot(h.x - cx, h.z - cz) < 4.5);
          cell[idx] = Math.min(near ? 2 : 1, cell[idx] + 1);
          paintCell(x, z);
        }
      }
    }

    // Flight along the survey path.
    const total = path.length - 1;
    let leg = 0;
    let legT = 0;
    const SPEED = 0.30; // fraction of a leg per second
    let drift = new THREE.Vector3();
    let sinceFix = 0;
    let lastObserve = 0;

    let running = true;
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let frames = 0;
    let fpsWindow = 0;
    let downgraded = false;

    const clampLeg = (i: number) => Math.min(Math.max(i, 0), total - 1);

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!running) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      // Adaptive quality: if the first two seconds are slow, drop the pixel ratio once.
      frames++;
      fpsWindow += dt;
      if (!downgraded && fpsWindow > 2) {
        const fps = frames / fpsWindow;
        if (fps < 40 && pixelRatio > 1) {
          pixelRatio = 1;
          renderer.setPixelRatio(1);
          downgraded = true;
        }
        frames = 0;
        fpsWindow = 0;
      }

      legT += dt * SPEED;
      while (legT >= 1) {
        legT -= 1;
        leg = (leg + 1) % total;
      }

      const a = path[clampLeg(leg)];
      const b = path[clampLeg(leg + 1)];
      const x = THREE.MathUtils.lerp(a.x, b.x, legT);
      const z = THREE.MathUtils.lerp(a.z, b.z, legT);
      const ground = height2d(x, z);
      const alt = 9 + Math.sin(elapsed * 0.7) * 0.35;

      drone.position.set(x, ground + alt, z);
      drone.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      drone.rotation.z = Math.sin(elapsed * 1.6) * 0.035;
      cone.position.set(x, ground + alt - 4.5, z);

      if (elapsed - lastObserve > 0.12) {
        observe(x, z);
        lastObserve = elapsed;
      }

      // Estimate view: dead reckoning drifts, a fix snaps it back.
      const estimating = modeRef.current === 'estimate';
      ghost.visible = estimating;
      driftLine.visible = estimating;
      if (estimating) {
        sinceFix += dt;
        drift.x += (Math.sin(elapsed * 0.9) * 0.6 + 0.35) * dt;
        drift.z += (Math.cos(elapsed * 0.7) * 0.6 + 0.3) * dt;
        if (sinceFix > 7) {
          sinceFix = 0;
          drift.multiplyScalar(0.06); // a fix arrives, the estimate snaps back
        }
        ghost.position.set(x + drift.x, ground + alt + drift.y * 0.2, z + drift.z);
        ghost.rotation.copy(drone.rotation);
        driftGeo.setFromPoints([drone.position.clone(), ghost.position.clone()]);
        driftGeo.attributes.position.needsUpdate = true;
      } else {
        drift.set(0, 0, 0);
        sinceFix = 0;
      }

      // Slow orbit, kept gentle so it never fights the reader.
      const ang = elapsed * 0.035;
      camera.position.set(Math.sin(ang) * 46, 50 + Math.sin(elapsed * 0.25) * 2, Math.cos(ang) * 46);
      camera.lookAt(0, 2, 0);

      renderer.render(scene, camera);

      if (Math.floor(elapsed * 4) % 2 === 0) {
        setReadout({
          alt: alt,
          drift: estimating ? Math.hypot(drift.x, drift.z) : 0,
          mapped: Math.round((mapped / (GRID * GRID)) * 100),
        });
      }
    }

    raf = requestAnimationFrame(frame);

    const io = new IntersectionObserver((entries) => {
      running = entries[0]?.isIntersecting ?? false;
    });
    io.observe(mount);

    const onVisibility = () => {
      if (document.hidden) running = false;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize);

    teardown = () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geo.dispose();
      scene.traverse((o) => {
        const m = o as ThreeNS.Mesh;
        if (m.geometry) m.geometry.dispose();
      });
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [enabled]);

  return (
    <div className={enabled ? 'hero-3d is3d' : 'hero-3d'}>
      {enabled ? (
        <div className="stage" ref={mountRef} aria-hidden="true" />
      ) : (
        <StaticMars labelled={decided} />
      )}

      <div className="overlay">
        <div className="tl">
          <span className="label">SkyScout survey</span>
          <span className="seedline mono">seed 20260808 / 80 x 80 m</span>
        </div>

        <div className="tr">
          {enabled ? (
          <>
          <div className="switch" role="group" aria-label="View: truth or estimate">
            <button
              type="button"
              className={mode === 'truth' ? 'on' : ''}
              onClick={() => setMode('truth')}
              aria-pressed={mode === 'truth'}
            >
              Truth
            </button>
            <button
              type="button"
              className={mode === 'estimate' ? 'on' : ''}
              onClick={() => setMode('estimate')}
              aria-pressed={mode === 'estimate'}
            >
              Estimate
            </button>
          </div>
          <p className="switch-note">
            {mode === 'truth'
              ? 'Where the drone actually is.'
              : 'Where the drone thinks it is. The gap is drift, until a fix arrives.'}
          </p>
          </>
          ) : (
            decided && <p className="switch-note static-note">Static view. The live survey runs on a wider screen with motion switched on.</p>
          )}
        </div>

        <div className="bl" style={{ visibility: enabled ? 'visible' : 'hidden' }}>
          <canvas ref={mapRef} className="minimap" aria-hidden="true" />
          <span className="label">Hazard map</span>
        </div>

        {enabled && (
          <div className="br mono">
            <div>
              <span className="k">ALT</span>
              <span className="v tabular">{readout.alt.toFixed(1)} m</span>
            </div>
            <div>
              <span className="k">DRIFT</span>
              <span className="v tabular" style={{ color: readout.drift > 0.05 ? 'var(--warn)' : 'var(--muted)' }}>
                {readout.drift.toFixed(2)} m
              </span>
            </div>
            <div>
              <span className="k">MAPPED</span>
              <span className="v tabular">{readout.mapped}%</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .hero-3d {
          position: relative;
          height: clamp(360px, 52vh, 540px);
          border: 1px solid var(--grid);
          border-radius: var(--radius);
          overflow: hidden;
          background:
            radial-gradient(ellipse 70% 60% at 50% 110%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%),
            var(--panel);
        }
        /* The live scene is a viewport onto Mars, so it keeps a deep-space backdrop in
           both themes. Without this the dark terrain sits badly on the Paper-mode panel
           and the HUD readouts lose their contrast. */
        .hero-3d.is3d {
          background:
            radial-gradient(ellipse 70% 60% at 50% 110%, rgba(217, 88, 43, 0.22), transparent 70%),
            #0b0d12;
          border-color: #1e2430;
        }
        .hero-3d.is3d .label,
        .hero-3d.is3d .seedline,
        .hero-3d.is3d .switch-note,
        .hero-3d.is3d .br .k { color: #8a8f9c; }
        .hero-3d.is3d .br .v { color: #e6e3da; }
        .hero-3d.is3d .switch { background: rgba(18, 22, 31, 0.9); border-color: #2a323f; }
        .hero-3d.is3d .switch button { color: #8a8f9c; }
        .hero-3d.is3d .switch button.on { background: var(--accent); color: #fff; }
        .hero-3d.is3d .minimap { background: rgba(11, 13, 18, 0.75); border-color: #2a323f; }
        .stage { position: absolute; inset: 0; }
        .stage canvas { width: 100% !important; height: 100% !important; }
        .overlay { position: absolute; inset: 0; pointer-events: none; padding: 0.9rem; }
        .overlay > * { position: absolute; pointer-events: auto; }
        .tl { top: 0.9rem; left: 0.9rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .seedline { font-size: 0.6875rem; color: var(--muted); }
        .tr { top: 0.9rem; right: 0.9rem; display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem; max-width: 15rem; }
        .switch { display: flex; border: 1px solid var(--grid); border-radius: var(--radius); overflow: hidden; background: color-mix(in srgb, var(--panel) 85%, transparent); }
        .switch button {
          font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: 0.06em;
          padding: 0.35rem 0.7rem; border: 0; background: none; color: var(--muted); cursor: pointer;
        }
        .switch button.on { background: var(--accent); color: #fff; }
        .switch-note { margin: 0; font-size: 0.6875rem; color: var(--muted); text-align: right; line-height: 1.4; }
        .static-note { display: block; }
        .bl { bottom: 0.9rem; left: 0.9rem; display: flex; flex-direction: column; gap: 0.3rem; }
        .minimap {
          width: 112px; height: 112px;
          border: 1px solid var(--grid);
          background: color-mix(in srgb, var(--bg) 70%, transparent);
          image-rendering: pixelated;
        }
        .br { bottom: 0.9rem; right: 0.9rem; display: flex; flex-direction: column; gap: 0.2rem; text-align: right; font-size: 0.6875rem; }
        .br .k { color: var(--muted); letter-spacing: 0.12em; margin-right: 0.6rem; }
        .br .v { color: var(--ink); }
        @media (max-width: 760px) {
          .tr { max-width: 9rem; }
          .switch-note:not(.static-note) { display: none; }
          .minimap { width: 84px; height: 84px; }
        }
      `}</style>
    </div>
  );
}

/** Static fallback for phones, low-power devices and reduced motion. */
function StaticMars({ labelled = false }: { labelled?: boolean }) {
  return (
    <svg className="poster" viewBox="0 0 800 460" role="img" aria-label="Illustration of a scout drone surveying Mars terrain">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--panel)" />
          <stop offset="100%" stopColor="var(--bg)" />
        </linearGradient>
      </defs>
      <rect width="800" height="460" fill="url(#sky)" />
      <g stroke="var(--grid)" strokeWidth="1" opacity="0.7">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={'h' + i} x1="0" y1={160 + i * 30} x2="800" y2={160 + i * 30} />
        ))}
        {Array.from({ length: 17 }, (_, i) => (
          <line key={'v' + i} x1={i * 50} y1="160" x2={i * 50 - 120} y2="460" />
        ))}
      </g>
      <g fill="none" stroke="var(--accent)" opacity="0.55">
        <ellipse cx="300" cy="330" rx="150" ry="52" />
        <ellipse cx="300" cy="330" rx="104" ry="36" />
        <ellipse cx="300" cy="330" rx="58" ry="20" />
      </g>
      <path
        d="M90 250 H700 M700 285 H90 M90 320 H700 M700 355 H90 M90 390 H700"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.4"
        fill="none"
      />
      <g transform="translate(470 268)">
        <circle r="26" fill="var(--accent)" opacity="0.12" />
        <rect x="-9" y="-4" width="18" height="8" fill="var(--ink)" />
        <g stroke="var(--accent)" strokeWidth="1.5" fill="none">
          <circle cx="-13" cy="-9" r="6" />
          <circle cx="13" cy="-9" r="6" />
          <circle cx="-13" cy="9" r="6" />
          <circle cx="13" cy="9" r="6" />
        </g>
      </g>
      {labelled && (
        <text x="40" y="60" fill="var(--muted)" fontFamily="var(--font-mono)" fontSize="13" letterSpacing="2">
          STATIC VIEW
        </text>
      )}
      <style>{`.poster { width: 100%; height: 100%; }`}</style>
    </svg>
  );
}
