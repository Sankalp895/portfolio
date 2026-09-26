import { useEffect, useRef, useState } from 'react';

/**
 * Illustration of the grokking shape and what a detection rule has to survive.
 * The curves are drawn for the page. They are not plotted from the paper's runs.
 */

const STEPS = 100;

function curves() {
  const train: number[] = [];
  const test: number[] = [];
  for (let i = 0; i < STEPS; i++) {
    const t = i / (STEPS - 1);
    train.push(1 / (1 + Math.exp(-(t - 0.12) * 34)));
    test.push(0.02 + 0.96 / (1 + Math.exp(-(t - 0.66) * 30)));
  }
  return { train, test };
}

export default function GrokkingDemo() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [strict, setStrict] = useState(true);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue('--ink').trim() || '#1d1d1f';
      const muted = css.getPropertyValue('--ink-faint').trim() || '#86868b';
      const accent = css.getPropertyValue('--accent').trim() || '#0284c7';
      const grid = css.getPropertyValue('--hairline').trim() || 'rgba(0,0,0,0.08)';
      const warn = css.getPropertyValue('--accent-bright').trim() || '#7dd3fc';
      const verified = css.getPropertyValue('--accent').trim() || '#0284c7';

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const pad = { l: 42, r: 14, t: 16, b: 30 };
      const pw = w - pad.l - pad.r;
      const ph = h - pad.t - pad.b;
      const X = (i: number) => pad.l + (i / (STEPS - 1)) * pw;
      const Y = (v: number) => pad.t + (1 - v) * ph;

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillStyle = muted;
      for (let g = 0; g <= 4; g++) {
        const v = g / 4;
        ctx.beginPath();
        ctx.moveTo(pad.l, Y(v));
        ctx.lineTo(w - pad.r, Y(v));
        ctx.stroke();
        ctx.fillText(v.toFixed(1), 8, Y(v) + 3);
      }
      ctx.fillText('training steps', pad.l, h - 8);

      const { train, test } = curves();

      const line = (data: number[], color: string, dash: number[] = []) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.setLineDash(dash);
        ctx.beginPath();
        data.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))));
        ctx.stroke();
        ctx.setLineDash([]);
      };

      line(train, muted, [4, 3]);
      line(test, ink);

      // The grokking point: where test accuracy actually takes off.
      const grok = test.findIndex((v) => v > 0.5);

      // A signal fires earlier. Under a strict rule the bar is higher, so it fires later.
      const fire = strict ? Math.round(grok * 0.72) : Math.round(grok * 0.28);

      ctx.strokeStyle = accent;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(X(grok), pad.t);
      ctx.lineTo(X(grok), pad.t + ph);
      ctx.stroke();

      ctx.strokeStyle = strict ? verified : warn;
      ctx.beginPath();
      ctx.moveTo(X(fire), pad.t);
      ctx.lineTo(X(fire), pad.t + ph);
      ctx.stroke();
      ctx.setLineDash([]);

      // Lead-time bracket between the two.
      ctx.strokeStyle = strict ? verified : warn;
      ctx.lineWidth = 1;
      const by = pad.t + 10;
      ctx.beginPath();
      ctx.moveTo(X(fire), by);
      ctx.lineTo(X(grok), by);
      ctx.stroke();

      ctx.fillStyle = strict ? verified : warn;
      ctx.fillText('lead time', X(fire) + 4, by - 4);

      ctx.fillStyle = accent;
      ctx.fillText('grokking', X(grok) + 4, pad.t + ph - 6);

      ctx.fillStyle = muted;
      ctx.fillText('train', X(STEPS - 1) - 30, Y(train[STEPS - 1]) - 6);
      ctx.fillStyle = ink;
      ctx.fillText('test', X(STEPS - 1) - 26, Y(test[STEPS - 1]) - 6);
    };

    draw();
    window.addEventListener('resize', draw);
    window.addEventListener('themechange', draw);
    return () => {
      window.removeEventListener('resize', draw);
      window.removeEventListener('themechange', draw);
    };
  }, [strict]);

  return (
    <div className="demo-wrap">
      <div className="bar">
        <span className="label">Detection rule</span>
        <div className="sw">
          <button type="button" className={strict ? 'on' : ''} onClick={() => setStrict(true)} aria-pressed={strict}>
            Pre-registered
          </button>
          <button type="button" className={!strict ? 'on' : ''} onClick={() => setStrict(false)} aria-pressed={!strict}>
            Chosen after
          </button>
        </div>
      </div>

      <canvas ref={ref} className="cv" role="img" aria-label="Training accuracy rises early, test accuracy jumps much later. A marker shows when an early-warning signal fires under each rule." />

      <p className="note">
        {strict
          ? 'With the rule fixed in advance, the signal has to clear a bar it did not choose. The lead time is smaller, and it means something.'
          : 'Pick the threshold after seeing the curves and the lead time grows. That extra lead is measurement freedom, not detection.'}
      </p>

      <style>{`
        .demo-wrap { border: 1px solid var(--hairline); border-radius: 1.25rem; background: var(--surface-solid); padding: 1.25rem; }
        .bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
        .sw { display: flex; border: 1px solid var(--hairline); border-radius: 999px; overflow: hidden; padding: 3px; gap: 2px; }
        .sw button {
          font-size: 0.75rem; font-weight: 500; padding: 0.3rem 0.8rem;
          border: 0; border-radius: 999px; background: none; color: var(--ink-soft); cursor: pointer;
        }
        .sw button.on { background: var(--accent); color: #fff; }
        .cv { width: 100%; height: 230px; display: block; }
        .note { margin: 0.5rem 0 0; font-size: 0.8125rem; color: var(--ink-faint); line-height: 1.55; }
      `}</style>
    </div>
  );
}
