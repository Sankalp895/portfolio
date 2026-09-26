import data from '@/data/research/surrogate.json';

/**
 * Observed convergence order against the order each scheme should have.
 * This is the gate the whole study rests on: the true error the indicators are
 * judged against comes from these solvers.
 *
 * Read from tables/solver_verification.csv.
 */

const W = 900;
const ROW = 52;
const PAD = { l: 210, r: 90, t: 16, b: 42 };
const MAX = 2.4;

export default function ConvergenceChart() {
  const rows = data.solver;
  const H = PAD.t + rows.length * ROW + PAD.b;
  const x = (v: number) => PAD.l + (v / MAX) * (W - PAD.l - PAD.r);

  return (
    <figure className="cc">
      <svg viewBox={`0 0 ${W} ${H}`} className="cc-svg" role="img"
           aria-label="Observed convergence order for each solver against the expected order, with the tolerance band.">
        {[0, 0.5, 1, 1.5, 2].map((g) => (
          <g key={g}>
            <line x1={x(g)} y1={PAD.t} x2={x(g)} y2={H - PAD.b} className="cc-grid" />
            <text x={x(g)} y={H - PAD.b + 18} className="cc-tick" textAnchor="middle">{g.toFixed(1)}</text>
          </g>
        ))}
        <text x={(W + PAD.l - PAD.r) / 2} y={H - 8} className="cc-axis" textAnchor="middle">convergence order</text>

        {rows.map((r, i) => {
          const cy = PAD.t + i * ROW + ROW / 2;
          return (
            <g key={r.solver}>
              <text x={PAD.l - 12} y={cy + 4} textAnchor="end" className="cc-name">{r.solver}</text>
              {/* Tolerance band around the expected order. */}
              <rect x={x(r.expected - r.tolerance)} y={cy - 13}
                    width={x(r.expected + r.tolerance) - x(r.expected - r.tolerance)} height={26}
                    className="cc-band" rx={3} />
              <line x1={x(r.expected)} y1={cy - 15} x2={x(r.expected)} y2={cy + 15} className="cc-expected" />
              <circle cx={x(r.observed)} cy={cy} r={6} className="cc-dot" />
              <text x={x(r.observed) + 14} y={cy + 4} className="cc-val">{r.observed.toFixed(4)}</text>
            </g>
          );
        })}
      </svg>

      <div className="cc-legend">
        <span><i className="sw dot" /> observed</span>
        <span><i className="sw exp" /> expected</span>
        <span><i className="sw band" /> tolerance</span>
      </div>

      <figcaption>
        Each solver refined on a grid and the slope measured. All four land inside the
        tolerance of the order the scheme should have, which is what makes the true error
        in the rest of the study worth measuring against.
        <span className="cc-src">Source: tables/solver_verification.csv</span>
      </figcaption>

      <style>{`
        .cc { margin: 0; }
        .cc-svg { width: 100%; height: auto; display: block; }
        .cc-grid { stroke: var(--grid); stroke-width: 1; }
        .cc-tick { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); }
        .cc-axis { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); letter-spacing: 0.06em; }
        .cc-name { font-size: 12.5px; fill: var(--ink); font-family: var(--font-mono); }
        .cc-band { fill: var(--verified); opacity: 0.14; }
        .cc-expected { stroke: var(--muted); stroke-width: 1.4; stroke-dasharray: 3 3; }
        .cc-dot { fill: var(--accent); }
        .cc-val { font-family: var(--font-mono); font-size: 11.5px; fill: var(--muted); }
        .cc-legend { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 0.9rem; font-size: 0.75rem; color: var(--muted); }
        .cc-legend span { display: inline-flex; align-items: center; gap: 0.45rem; }
        .sw { width: 14px; height: 10px; border-radius: 2px; display: inline-block; }
        .sw.dot { background: var(--accent); border-radius: 50%; height: 12px; width: 12px; }
        .sw.exp { background: var(--muted); height: 2px; }
        .sw.band { background: var(--verified); opacity: 0.3; }
        figcaption { margin-top: 1rem; font-size: 0.8125rem; color: var(--muted); line-height: 1.6; display: flex; flex-direction: column; gap: 0.4rem; }
        .cc-src { font-family: var(--font-mono); font-size: 0.6875rem; opacity: 0.8; }
      `}</style>
    </figure>
  );
}
