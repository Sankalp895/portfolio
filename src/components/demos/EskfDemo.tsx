import { useEffect, useRef, useState } from 'react';

/**
 * Dead reckoning against a filtered estimate, on a 2D path.
 * An illustration of why the SkyScout drift number needed a filter. Not simulator output.
 */

export default function EskfDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [filterOn, setFilterOn] = useState(false);
  const [err, setErr] = useState(0);
  const onRef = useRef(filterOn);

  useEffect(() => {
    onRef.current = filterOn;
  }, [filterOn]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Truth: a lawnmower path, same idea as the survey.
    const truth: { x: number; y: number }[] = [];
    for (let i = 0; i <= 600; i++) {
      const t = i / 600;
      const leg = Math.floor(t * 4);
      const p = (t * 4) % 1;
      const y = 0.12 + leg * 0.25;
      const x = leg % 2 === 0 ? 0.08 + p * 0.84 : 0.92 - p * 0.84;
      truth.push({ x, y });
    }

    let i = 0;
    let drift = { x: 0, y: 0 };
    let raf = 0;
    let running = true;
    let last = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!running) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue('--ink').trim() || '#1d1d1f';
      const muted = css.getPropertyValue('--ink-faint').trim() || '#86868b';
      const accent = css.getPropertyValue('--accent').trim() || '#0284c7';
      const warn = css.getPropertyValue('--accent-bright').trim() || '#7dd3fc';
      const verified = css.getPropertyValue('--accent').trim() || '#0284c7';
      const grid = css.getPropertyValue('--hairline').trim() || 'rgba(0,0,0,0.08)';

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== w * dpr || cv.height !== h * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const X = (v: number) => v * w;
      const Y = (v: number) => v * h;

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (let g = 1; g < 8; g++) {
        ctx.beginPath();
        ctx.moveTo((g / 8) * w, 0);
        ctx.lineTo((g / 8) * w, h);
        ctx.moveTo(0, (g / 8) * h);
        ctx.lineTo(w, (g / 8) * h);
        ctx.stroke();
      }

      i = (i + (reduced ? 3 : 1)) % truth.length;

      // Dead reckoning: bias plus a slow wander, growing without bound.
      const growth = onRef.current ? 0.12 : 1;
      drift.x += (0.035 + Math.sin(i / 90) * 0.02) * dt * growth;
      drift.y += (0.022 + Math.cos(i / 70) * 0.02) * dt * growth;

      // With the filter on, corrections pull the estimate back towards truth.
      if (onRef.current) {
        drift.x *= 1 - 1.6 * dt;
        drift.y *= 1 - 1.6 * dt;
      }

      const path = (from: number, to: number, color: string, wdt: number, offset = { x: 0, y: 0 }) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = wdt;
        ctx.beginPath();
        for (let k = from; k <= to; k++) {
          const p = truth[k];
          const px = X(p.x + offset.x * (k / truth.length));
          const py = Y(p.y + offset.y * (k / truth.length));
          if (k === from) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };

      path(0, truth.length - 1, muted, 1);
      path(0, i, ink, 2);

      const t = truth[i];
      const est = { x: t.x + drift.x, y: t.y + drift.y };

      ctx.strokeStyle = onRef.current ? verified : warn;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k <= i; k += 3) {
        const p = truth[k];
        const s = k / Math.max(i, 1);
        const px = X(p.x + drift.x * s);
        const py = Y(p.y + drift.y * s);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(X(t.x), Y(t.y), 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = onRef.current ? verified : warn;
      ctx.beginPath();
      ctx.arc(X(est.x), Y(est.y), 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = onRef.current ? verified : warn;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(t.x), Y(t.y));
      ctx.lineTo(X(est.x), Y(est.y));
      ctx.stroke();
      ctx.setLineDash([]);

      if (i % 6 === 0) setErr(Math.hypot(drift.x, drift.y) * 80);
    };

    raf = requestAnimationFrame(draw);

    const io = new IntersectionObserver((e) => {
      running = e[0]?.isIntersecting ?? false;
    });
    io.observe(cv);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <div className="eskf">
      <div className="bar">
        <span className="label">Estimator</span>
        <div className="sw">
          <button type="button" className={!filterOn ? 'on' : ''} onClick={() => setFilterOn(false)} aria-pressed={!filterOn}>
            Dead reckoning
          </button>
          <button type="button" className={filterOn ? 'on' : ''} onClick={() => setFilterOn(true)} aria-pressed={filterOn}>
            ESKF
          </button>
        </div>
      </div>

      <canvas ref={ref} className="cv" role="img" aria-label="A survey path with the true position and the estimated position drifting apart, and the gap closing when the filter is on." />

      <div className="foot">
        <span className="label">Gap between truth and estimate</span>
        <span className="metric tabular" style={{ color: filterOn ? 'var(--accent)' : 'var(--accent-bright)' }}>
          {err.toFixed(2)} m
        </span>
      </div>

      <p className="note">
        Illustration. In SkyScout, dead reckoning drifted 10.9 m in 14.4 s, and the ESKF removed it while also
        recovering the sensor biases I had injected.
      </p>

      <style>{`
        .eskf { border: 1px solid var(--hairline); border-radius: 1.25rem; background: var(--surface-solid); padding: 1.25rem; }
        .bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
        .sw { display: flex; border: 1px solid var(--hairline); border-radius: 999px; overflow: hidden; padding: 3px; gap: 2px; }
        .sw button {
          font-size: 0.75rem; font-weight: 500; padding: 0.3rem 0.8rem;
          border: 0; border-radius: 999px; background: none; color: var(--ink-soft); cursor: pointer;
        }
        .sw button.on { background: var(--accent); color: #fff; }
        .cv { width: 100%; height: 240px; display: block; }
        .foot {
          display: flex; align-items: baseline; justify-content: space-between;
          gap: 1rem; padding-top: 0.6rem; margin-top: 0.4rem; border-top: 1px solid var(--hairline);
        }
        .note { margin: 0.55rem 0 0; font-size: 0.75rem; color: var(--ink-faint); line-height: 1.55; }
      `}</style>
    </div>
  );
}
