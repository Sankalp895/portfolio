import { useState } from 'react';
import data from '@/data/research/surrogate.json';

/**
 * Every trust indicator in the six most-shifted cells, next to the input-only
 * null model. Bars are the mean Spearman correlation with true error across the
 * six cells, with the spread across cells shown as a line.
 *
 * Read from tables/indicator_summary.csv. Nothing is recomputed beyond the mean
 * across the six cells, which the caption states.
 */

const W = 900;
const ROW = 34;
const PAD = { l: 250, r: 70, t: 14, b: 40 };

const LABEL: Record<string, string> = {
  null_best_supervised: 'Input-only null model',
  null_best: 'Input-only null model',
  residual_supervised: 'PDE residual',
  residual_raw: 'PDE residual (raw)',
  residual_normalised: 'PDE residual (normalised)',
  ensemble_supervised: 'Seed-ensemble disagreement',
  ensemble: 'Seed-ensemble disagreement',
  embedding_probe: 'Frozen-feature embedding probe',
  embedding_mahalanobis: 'Embedding Mahalanobis distance',
  input_features_supervised: 'Input features',
  input_features: 'Input features',
  input_floor_supervised: 'Input floor',
  input_floor: 'Input floor',
  autocorrelation_lags_supervised: 'Autocorrelation lags',
  autocorrelation_lags: 'Autocorrelation lags',
  amplitude_quantiles_probe: 'Amplitude quantiles probe',
  random_encoder_probe: 'Random encoder probe',
  random_projections_probe: 'Random projections probe',
};

export default function IndicatorChart() {
  const [family, setFamily] = useState<'supervised' | 'unsupervised'>('supervised');

  const rows = data.spearman
    .filter((r) => r.family === family)
    .sort((a, b) => b.meanSpearman - a.meanSpearman);

  const H = PAD.t + rows.length * ROW + PAD.b;
  const x = (v: number) => PAD.l + Math.max(v, 0) * (W - PAD.l - PAD.r);
  const zero = PAD.l;

  return (
    <figure className="ic">
      <div className="ic-controls">
        <span className="ic-label">Family</span>
        <div className="ic-seg">
          {(['supervised', 'unsupervised'] as const).map((f) => (
            <button key={f} type="button" className={family === f ? 'on' : ''}
                    onClick={() => setFamily(f)} aria-pressed={family === f}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="ic-svg" role="img"
           aria-label="Mean Spearman correlation with true error for each indicator, with the input-only null model shown for comparison.">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={x(g)} y1={PAD.t} x2={x(g)} y2={H - PAD.b} className="ic-grid" />
            <text x={x(g)} y={H - PAD.b + 18} className="ic-tick" textAnchor="middle">{g.toFixed(2)}</text>
          </g>
        ))}
        <text x={(W + PAD.l - PAD.r) / 2} y={H - 8} className="ic-axis" textAnchor="middle">
          mean Spearman correlation with true error, severe regime
        </text>

        {rows.map((r, i) => {
          const cy = PAD.t + i * ROW + ROW / 2;
          const w = Math.max(x(r.meanSpearman) - zero, 1);
          return (
            <g key={r.indicator}>
              <text x={PAD.l - 12} y={cy + 4} textAnchor="end"
                    className={r.isNull ? 'ic-name null' : 'ic-name'}>
                {LABEL[r.indicator] ?? r.indicator}
              </text>
              <rect x={zero} y={cy - 9} width={w} height={18} rx={3}
                    className={r.isNull ? 'ic-bar null' : 'ic-bar'} />
              <line x1={x(r.minSpearman)} y1={cy} x2={x(r.maxSpearman)} y2={cy} className="ic-range" />
              <text x={x(r.meanSpearman) + 10} y={cy + 4} className="ic-val">
                {r.meanSpearman.toFixed(3)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="ic-legend">
        <span><i className="sw null" /> input-only null model</span>
        <span><i className="sw ind" /> trust indicator</span>
        <span><i className="sw rng" /> spread across the six cells</span>
      </div>

      <figcaption>
        Each bar is one indicator, measured on the six most-shifted cells. Higher means
        the indicator tracked the surrogate's true error more closely. The null model
        never runs the surrogate and only sees the input, so anything at or below it is
        not using the surrogate to detect error. In the {family} family the null sits at{' '}
        {rows.find((r) => r.isNull)?.meanSpearman.toFixed(3)}.
        <span className="ic-src">Source: tables/indicator_summary.csv, regime = severe, representability = all</span>
      </figcaption>

      <style>{`
        .ic { margin: 0; }
        .ic-controls { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1rem; }
        .ic-label { font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
        .ic-seg { display: flex; border: var(--rule); border-radius: var(--radius); overflow: hidden; }
        .ic-seg button {
          font-family: var(--font-mono); font-size: 0.6875rem; padding: 0.35rem 0.8rem;
          border: 0; background: none; color: var(--muted); cursor: pointer;
        }
        .ic-seg button.on { background: var(--accent); color: #fff; }
        .ic-svg { width: 100%; height: auto; display: block; }
        .ic-grid { stroke: var(--grid); stroke-width: 1; }
        .ic-tick { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); }
        .ic-axis { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); letter-spacing: 0.06em; }
        .ic-name { font-size: 12px; fill: var(--muted); font-family: var(--font-ui); }
        .ic-name.null { fill: var(--ink); font-weight: 600; }
        .ic-bar { fill: var(--muted); opacity: 0.45; }
        .ic-bar.null { fill: var(--accent); opacity: 1; }
        .ic-range { stroke: var(--ink); stroke-width: 1.5; opacity: 0.35; }
        .ic-val { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); }
        .ic-legend { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 0.9rem; font-size: 0.75rem; color: var(--muted); }
        .ic-legend span { display: inline-flex; align-items: center; gap: 0.45rem; }
        .sw { width: 14px; height: 10px; border-radius: 2px; display: inline-block; }
        .sw.null { background: var(--accent); }
        .sw.ind { background: var(--muted); opacity: 0.45; }
        .sw.rng { height: 2px; background: var(--ink); opacity: 0.35; }
        figcaption { margin-top: 1rem; font-size: 0.8125rem; color: var(--muted); line-height: 1.6; display: flex; flex-direction: column; gap: 0.4rem; }
        .ic-src { font-family: var(--font-mono); font-size: 0.6875rem; opacity: 0.8; }
        @media (max-width: 720px) { .ic-name { font-size: 15px; } }
      `}</style>
    </figure>
  );
}
