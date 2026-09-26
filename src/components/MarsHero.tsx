import { useEffect, useRef, useState } from 'react';
import type * as ThreeNS from 'three';

/**
 * The Mars survey hero. An illustration of the SkyScout idea, drawn in the browser
 * from seed 20260808, the same seed the real SkyScout world uses. It is not
 * simulator output, and the page says so underneath it.
 *
 * Three.js is imported dynamically, so phones and reduced-motion visitors never
 * download it. They get the static poster instead.
 */

const SEED = 20260808;
const TERRAIN_M = 80;
const SEGMENTS = 128;
const GRID = 28;
const TRAIL = 90;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Height field. Six octaves of value noise for the ground texture, a crater with a
 * raised rim and a bowl, and a ridge running across. Deterministic for a given seed.
 */
function makeHeightField(seed: number) {
  const rnd = mulberry32(seed);

  const octaves = Array.from({ length: 6 }, (_, i) => ({
    fx: (0.035 + rnd() * 0.03) * Math.pow(1.9, i),
    fy: (0.035 + rnd() * 0.03) * Math.pow(1.9, i),
    px: rnd() * Math.PI * 2,
    py: rnd() * Math.PI * 2,
    amp: 2.6 / Math.pow(2.05, i),
  }));

  const crater = { x: -13 + rnd() * 6, y: 8 - rnd() * 6, r: 14 + rnd() * 3, depth: 4.2 };
  const crater2 = { x: 19 - rnd() * 5, y: -17 + rnd() * 5, r: 6 + rnd() * 2, depth: 1.8 };
  const ridgeAngle = rnd() * Math.PI;

  return function height(x: number, y: number) {
    let h = 0;
    for (const o of octaves) h += Math.sin(x * o.fx + o.px) * Math.cos(y * o.fy + o.py) * o.amp;

    // A ridge: a raised band running across the map.
    const t = x * Math.cos(ridgeAngle) + y * Math.sin(ridgeAngle);
    h += Math.exp(-((t - 6) * (t - 6)) / 130) * 3.1;

    for (const c of [crater, crater2]) {
      const d = Math.hypot(x - c.x, y - c.y);
      if (d < c.r * 1.6) {
        const rim = Math.exp(-((d - c.r) * (d - c.r)) / (c.r * 0.9)) * (c.depth * 0.55);
        const bowl = d < c.r ? -c.depth * Math.cos((d / c.r) * Math.PI * 0.5) : 0;
        h += rim + bowl;
      }
    }
    return h;
  };
}

/** Lawnmower survey path, the pattern SkyScout flies. */
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
  const [enabled, setEnabled] = useState(false);
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
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      } catch {
        setEnabled(false);
        return;
      }

      const width = mount.clientWidth;
      const height = mount.clientHeight;
      // Capped for integrated graphics. Dropped again below if the first seconds are slow.
      let pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);

      const SKY = 0x2a1410;
      const HAZE = 0xc06a3a;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(SKY);
      // Atmospheric haze toward the horizon.
      scene.fog = new THREE.Fog(HAZE, 55, 165);

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 400);

      const height2d = makeHeightField(SEED);

      // Terrain. Vertex colours run from dark basalt in the hollows up through rust
      // to pale ochre on the high ground, with a little noise so it is not a clean ramp.
      const geo = new THREE.PlaneGeometry(TERRAIN_M, TERRAIN_M, SEGMENTS, SEGMENTS);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position as ThreeNS.BufferAttribute;
      const colors = new Float32Array(pos.count * 3);

      const cLow = new THREE.Color(0x3d1c14);
      const cMid = new THREE.Color(0x8c4526);
      const cHigh = new THREE.Color(0xc98950);
      const tint = mulberry32(SEED + 3);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const h = height2d(x, z);
        pos.setY(i, h);

        const t = THREE.MathUtils.clamp((h + 5) / 10, 0, 1);
        const c = t < 0.5 ? cLow.clone().lerp(cMid, t * 2) : cMid.clone().lerp(cHigh, (t - 0.5) * 2);
        const grit = 0.93 + tint() * 0.14;
        colors[i * 3] = c.r * grit;
        colors[i * 3 + 1] = c.g * grit;
        colors[i * 3 + 2] = c.b * grit;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();

      const terrain = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, flatShading: false })
      );
      terrain.receiveShadow = true;
      scene.add(terrain);

      // Boulders, instanced so the whole field costs one draw call.
      const rnd = mulberry32(SEED + 7);
      const COUNT = 90;
      const boulders = new THREE.InstancedMesh(
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.MeshStandardMaterial({ color: 0x6b3a26, roughness: 1 }),
        COUNT
      );
      const dummy = new THREE.Object3D();
      const hazards: { x: number; z: number }[] = [];
      for (let i = 0; i < COUNT; i++) {
        const x = (rnd() - 0.5) * (TERRAIN_M - 6);
        const z = (rnd() - 0.5) * (TERRAIN_M - 6);
        const s = 0.35 + rnd() * 1.7;
        dummy.position.set(x, height2d(x, z) + s * 0.35, z);
        dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
        dummy.scale.set(s, s * (0.55 + rnd() * 0.5), s);
        dummy.updateMatrix();
        boulders.setMatrixAt(i, dummy.matrix);
        if (s > 1.05) hazards.push({ x, z });
      }
      boulders.castShadow = true;
      boulders.receiveShadow = true;
      scene.add(boulders);

      const path = surveyPath(THREE);
      const pathLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          path.map((p) => new THREE.Vector3(p.x, height2d(p.x, p.z) + 9, p.z))
        ),
        new THREE.LineBasicMaterial({ color: 0xffb07a, transparent: true, opacity: 0.28 })
      );
      scene.add(pathLine);

      // Drone: body, arms, four rotor discs, a camera housing under the nose.
      function makeDrone(ghost: boolean) {
        const g = new THREE.Group();
        const shell = new THREE.MeshStandardMaterial({
          color: ghost ? 0x9a8f88 : 0xf2efe9,
          roughness: 0.5,
          metalness: 0.1,
          transparent: ghost,
          opacity: ghost ? 0.4 : 1,
        });
        const dark = new THREE.MeshStandardMaterial({
          color: ghost ? 0x7a7068 : 0x2e2a27,
          roughness: 0.7,
          transparent: ghost,
          opacity: ghost ? 0.4 : 1,
        });

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.46, 1.9), shell);
        body.castShadow = !ghost;
        g.add(body);

        // Camera housing, pointing down.
        const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.36, 12), dark);
        cam.position.set(0, -0.36, 0.45);
        g.add(cam);

        for (const [dx, dz] of [[1.25, 1.15], [-1.25, 1.15], [1.25, -1.15], [-1.25, -1.15]]) {
          const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.16), dark);
          arm.position.set(dx * 0.5, 0.02, dz * 0.5);
          arm.rotation.y = Math.atan2(dz, dx);
          g.add(arm);

          const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 8), dark);
          hub.position.set(dx, 0.14, dz);
          g.add(hub);

          // Rotor disc: a spinning blur rather than modelled blades.
          const disc = new THREE.Mesh(
            new THREE.CircleGeometry(0.62, 18),
            new THREE.MeshBasicMaterial({
              color: ghost ? 0x9a8f88 : 0xdfe6ea,
              transparent: true,
              opacity: ghost ? 0.18 : 0.34,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          );
          disc.rotation.x = -Math.PI / 2;
          disc.position.set(dx, 0.24, dz);
          g.add(disc);

          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.62, 0.035, 4, 16),
            new THREE.MeshStandardMaterial({
              color: ghost ? 0x9a8f88 : 0xff8c52,
              roughness: 0.6,
              transparent: ghost,
              opacity: ghost ? 0.4 : 1,
            })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(dx, 0.24, dz);
          g.add(ring);
        }
        return g;
      }

      const drone = makeDrone(false);
      const ghost = makeDrone(true);
      drone.scale.setScalar(1.9);
      ghost.scale.setScalar(1.9);
      ghost.visible = false;
      scene.add(drone, ghost);

      // Camera cone, showing what the downward sensor covers.
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(5.4, 9, 20, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xffc89a,
          transparent: true,
          opacity: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      cone.rotation.x = Math.PI;
      scene.add(cone);

      // Fading flight trail behind the drone.
      const trailPos = new Float32Array(TRAIL * 3);
      const trailAlpha = new Float32Array(TRAIL);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
      trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAlpha, 1));
      const trail = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({ color: 0xffb07a, transparent: true, opacity: 0.55 })
      );
      scene.add(trail);
      let trailCount = 0;

      const driftGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const driftLine = new THREE.Line(
        driftGeo,
        new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.9 })
      );
      driftLine.visible = false;
      scene.add(driftLine);

      // Low warm sun, long shadows.
      scene.add(new THREE.HemisphereLight(0xffd9c0, 0x2a1008, 0.55));
      const sun = new THREE.DirectionalLight(0xffb478, 2.5);
      sun.position.set(-46, 19, 24);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 160;
      const sc = sun.shadow.camera as ThreeNS.OrthographicCamera;
      sc.left = -52; sc.right = 52; sc.top = 52; sc.bottom = -52;
      sc.updateProjectionMatrix();
      scene.add(sun);

      // Hazard mini-map, plain 2D canvas, filled in as the drone covers ground.
      const ctx = mapCanvas.getContext('2d');
      const cell = new Float32Array(GRID * GRID);
      const mapPx = 180;
      mapCanvas.width = mapPx;
      mapCanvas.height = mapPx;
      const cellPx = mapPx / GRID;

      function paintCell(ix: number, iz: number) {
        if (!ctx) return;
        const v = cell[iz * GRID + ix];
        if (v <= 0) return;
        ctx.fillStyle = v > 1.5 ? 'rgba(255, 140, 82, 0.9)' : 'rgba(255, 214, 180, 0.26)';
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
            const near = hazards.some((h) => Math.hypot(h.x - cx, h.z - cz) < 4.2);
            cell[idx] = Math.min(near ? 2 : 1, cell[idx] + 1);
            paintCell(x, z);
          }
        }
      }

      const total = path.length - 1;
      let leg = 0;
      let legT = 0;
      const SPEED = 0.28;
      const drift = new THREE.Vector3();
      let sinceFix = 0;
      let lastObserve = 0;
      let lastTrail = 0;
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

        // Adaptive quality: if the opening seconds are slow, drop pixel ratio once.
        frames++;
        fpsWindow += dt;
        if (!downgraded && fpsWindow > 2) {
          if (frames / fpsWindow < 45 && pixelRatio > 1) {
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
        drone.rotation.z = Math.sin(elapsed * 1.6) * 0.03;
        cone.position.set(x, ground + alt - 4.5, z);

        // Trail: push the current point, fade the tail.
        if (elapsed - lastTrail > 0.06) {
          lastTrail = elapsed;
          for (let i = TRAIL - 1; i > 0; i--) {
            trailPos[i * 3] = trailPos[(i - 1) * 3];
            trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1];
            trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2];
          }
          trailPos[0] = x;
          trailPos[1] = ground + alt - 0.5;
          trailPos[2] = z;
          if (trailCount < TRAIL) trailCount++;
          trailGeo.setDrawRange(0, trailCount);
          trailGeo.attributes.position.needsUpdate = true;
        }

        if (elapsed - lastObserve > 0.11) {
          observe(x, z);
          lastObserve = elapsed;
        }

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
          ghost.position.set(x + drift.x, ground + alt, z + drift.z);
          ghost.rotation.copy(drone.rotation);
          driftGeo.setFromPoints([drone.position.clone(), ghost.position.clone()]);
          driftGeo.attributes.position.needsUpdate = true;
        } else {
          drift.set(0, 0, 0);
          sinceFix = 0;
        }

        const ang = elapsed * 0.03;
        camera.position.set(Math.sin(ang) * 52, 34 + Math.sin(elapsed * 0.22) * 2.5, Math.cos(ang) * 52);
        camera.lookAt(0, 1, 0);

        renderer.render(scene, camera);

        if (Math.floor(elapsed * 4) % 2 === 0) {
          setReadout({
            alt,
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
    <div className={enabled ? 'mh-wrap mh-live' : 'mh-wrap'}>
      {enabled ? <div className="mh-stage" ref={mountRef} aria-hidden="true" /> : <MarsPoster labelled={decided} />}

      <div className="mh-vignette" aria-hidden="true" />

      <div className="mh-overlay">
        <div className="mh-tl">
          <span className="mh-lbl">SkyScout survey</span>
          <span className="mh-sub mono">seed 20260808 / 80 x 80 m</span>
        </div>

        <div className="mh-tr">
          {enabled ? (
            <>
              <div className="mh-seg" role="group" aria-label="View: truth or estimate">
                <button type="button" className={mode === 'truth' ? 'on' : ''} onClick={() => setMode('truth')} aria-pressed={mode === 'truth'}>
                  Truth
                </button>
                <button type="button" className={mode === 'estimate' ? 'on' : ''} onClick={() => setMode('estimate')} aria-pressed={mode === 'estimate'}>
                  Estimate
                </button>
              </div>
              <p className="mh-note">
                {mode === 'truth'
                  ? 'Where the drone actually is.'
                  : 'Where the drone thinks it is. The gap is drift, until a fix arrives.'}
              </p>
            </>
          ) : (
            decided && <p className="mh-note mh-static">Static view. The live survey runs on a wider screen with motion switched on.</p>
          )}
        </div>

        <div className="mh-bl" style={{ visibility: enabled ? 'visible' : 'hidden' }}>
          <canvas ref={mapRef} className="mh-map" aria-hidden="true" />
          <span className="mh-lbl">Hazard map</span>
        </div>

        {enabled && (
          <div className="mh-br mono">
            <div><span className="mh-k">ALT</span><span className="mh-v">{readout.alt.toFixed(1)} m</span></div>
            <div><span className="mh-k">DRIFT</span><span className="mh-v" style={{ color: readout.drift > 0.05 ? '#ffc89a' : 'rgba(255,255,255,0.55)' }}>{readout.drift.toFixed(2)} m</span></div>
            <div><span className="mh-k">MAPPED</span><span className="mh-v">{readout.mapped}%</span></div>
          </div>
        )}
      </div>

      <style>{`
        .mh-wrap {
          position: relative;
          height: clamp(420px, 62vh, 660px);
          border-radius: 1.75rem;
          overflow: hidden;
          border: 1px solid var(--hairline);
          background: #2a1410;
        }
        .mh-stage { position: absolute; inset: 0; }
        .mh-stage canvas { width: 100% !important; height: 100% !important; }

        /* Subtle vignette, drawn over the scene rather than in it. */
        .mh-vignette {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 78% 68% at 50% 46%, transparent 40%, rgba(20, 8, 5, 0.55) 100%);
        }

        .mh-overlay { position: absolute; inset: 0; pointer-events: none; }
        .mh-overlay > * { position: absolute; pointer-events: auto; }

        /* Over the render the chrome is always light, so it stays legible in both themes. */
        .mh-live .mh-lbl { color: rgba(255,255,255,0.92); }
        .mh-live .mh-sub, .mh-live .mh-note { color: rgba(255,255,255,0.6); }
        .mh-live .mh-k { color: rgba(255,255,255,0.5); }
        .mh-live .mh-v { color: rgba(255,255,255,0.95); }

        .mh-lbl { font-size: 0.75rem; font-weight: 600; color: var(--ink); }
        .mh-sub { font-size: 0.6875rem; color: var(--ink-faint); }
        .mh-tl { top: 1.15rem; left: 1.15rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .mh-tr { top: 1.15rem; right: 1.15rem; display: flex; flex-direction: column; align-items: flex-end; gap: 0.45rem; max-width: 15rem; }

        .mh-seg {
          display: flex; padding: 3px; gap: 2px; border-radius: 999px;
          background: rgba(24, 12, 8, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(14px);
        }
        .mh-seg button {
          font-size: 0.75rem; font-weight: 500; padding: 0.32rem 0.9rem;
          border: 0; border-radius: 999px; background: none; color: rgba(255,255,255,0.65); cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .mh-seg button.on { background: rgba(255,255,255,0.95); color: #2a1410; }

        .mh-note { margin: 0; font-size: 0.6875rem; text-align: right; line-height: 1.45; }
        .mh-bl { bottom: 1.15rem; left: 1.15rem; display: flex; flex-direction: column; gap: 0.35rem; }
        .mh-map {
          width: 106px; height: 106px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(24, 12, 8, 0.5);
          image-rendering: pixelated;
        }
        .mh-br { bottom: 1.15rem; right: 1.15rem; display: flex; flex-direction: column; gap: 0.2rem; text-align: right; font-size: 0.6875rem; }
        .mh-br .mh-k { margin-right: 0.7rem; letter-spacing: 0.08em; }

        @media (max-width: 760px) {
          .mh-tr { max-width: 11rem; }
          .mh-note:not(.mh-static) { display: none; }
          .mh-map { width: 78px; height: 78px; }
        }
      `}</style>
    </div>
  );
}

/**
 * Static fallback for phones, low-power devices and reduced motion.
 * Drawn to match the live scene: warm sky, lit ridge, crater rings, survey path.
 */
function MarsPoster({ labelled = false }: { labelled?: boolean }) {
  return (
    <svg className="mh-poster" viewBox="0 0 800 470" role="img" aria-label="Illustration of a scout drone surveying Mars terrain from above">
      <defs>
        <linearGradient id="mh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1410" />
          <stop offset="70%" stopColor="#71301b" />
          <stop offset="100%" stopColor="#c06a3a" />
        </linearGradient>
        <linearGradient id="mh-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a85a30" />
          <stop offset="100%" stopColor="#3d1c14" />
        </linearGradient>
        <radialGradient id="mh-vig" cx="50%" cy="46%" r="70%">
          <stop offset="40%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(20,8,5,0.6)" />
        </radialGradient>
      </defs>

      <rect width="800" height="470" fill="url(#mh-sky)" />
      <ellipse cx="150" cy="150" rx="60" ry="60" fill="#ffb478" opacity="0.22" />
      <ellipse cx="150" cy="150" rx="26" ry="26" fill="#ffd9a0" opacity="0.5" />

      <path d="M0 210 Q 180 170 340 200 T 800 186 L800 470 L0 470 Z" fill="url(#mh-ground)" />

      <g fill="none" stroke="#2e120c" opacity="0.5">
        <ellipse cx="300" cy="340" rx="160" ry="54" />
        <ellipse cx="300" cy="340" rx="108" ry="36" />
        <ellipse cx="300" cy="340" rx="56" ry="19" />
      </g>

      <g fill="#5b2818" opacity="0.85">
        <ellipse cx="120" cy="392" rx="13" ry="8" />
        <ellipse cx="640" cy="360" rx="10" ry="6" />
        <ellipse cx="522" cy="424" rx="16" ry="9" />
        <ellipse cx="228" cy="268" rx="7" ry="4" />
        <ellipse cx="704" cy="286" rx="8" ry="5" />
      </g>

      <path d="M70 262 H720 M720 300 H70 M70 338 H720 M720 380 H70 M70 424 H720"
            stroke="#ffb07a" strokeWidth="1.5" opacity="0.32" fill="none" />

      <g transform="translate(470 250)">
        <ellipse cx="6" cy="96" rx="34" ry="9" fill="#2a1008" opacity="0.4" />
        <path d="M-24 6 L24 6 L6 92 Z" fill="#ffc89a" opacity="0.1" />
        <rect x="-13" y="-5" width="26" height="9" rx="2" fill="#f2efe9" />
        <rect x="-4" y="4" width="8" height="5" rx="1.5" fill="#2e2a27" />
        <g stroke="#ff8c52" strokeWidth="1.6" fill="none">
          <ellipse cx="-18" cy="-10" rx="9" ry="3" />
          <ellipse cx="18" cy="-10" rx="9" ry="3" />
          <ellipse cx="-18" cy="6" rx="9" ry="3" />
          <ellipse cx="18" cy="6" rx="9" ry="3" />
        </g>
      </g>

      <rect width="800" height="470" fill="url(#mh-vig)" />

      {labelled && (
        <text x="40" y="58" fill="rgba(255,255,255,0.55)" fontSize="12" letterSpacing="1.5">
          STATIC VIEW
        </text>
      )}
      <style>{`.mh-poster { width: 100%; height: 100%; }`}</style>
    </svg>
  );
}
