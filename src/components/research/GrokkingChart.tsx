import { useMemo, useState } from 'react';
import data from '@/data/research/grokking.json';

/**
 * Training curves for one seed, with the step the chosen signal fired on and the
 * step test accuracy crossed the grokking threshold. The gap between the two is
 * the lead time.
 *
 * Every value is read from logs/predictor_seed{n}.csv and logs/lead_times.csv.
 * Nothing is smoothed or recomputed here.
 */

const W = 900;
const H = 420;
const PAD = { l: 56, r: 24, t: 22, b: 46 };

const SIGNALS = [
  { key: 'fourier_top_k_power', label: 'Fourier top-k power' },
  { key: 'fourier_entropy', label: 'Fourier entropy' },
  { key: 'fourier_eff_freqs', label: 'Fourier effective frequencies' },
  { key: 'embed_norm', label: 'Embedding norm' },
  { key: 'embed_eff_rank', label: 'Effective embedding rank' },
  { key: 'weight_norm', label: 'Weight norm' },
];

export default function GrokkingChart() {
  const [seedIdx, setSeedIdx] = useState(0);
  const [signal, setSignal] = useState(SIGNALS[0].key);

  const seed = data.seeds[seedIdx];
  const maxStep = seed.step[seed.step.length - 1];

  const x = (s: number) => PAD.l + (s / maxStep) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v) * (H - PAD.t - PAD.b);

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i ? 'L' : 'M'}${x(seed.step[i]).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  const trainPath = useMemo(() => path(seed.trainAcc), [seedIdx]);
  const testPath = useMemo(() => path(seed.testAcc), [seedIdx]);

  const fire = (seed.fires as Record<string, number>)[signal];
  const grok = seed.grokStep;
  const lead = fire == null ? null : grok - fire;

  return (
    <figure className="gc">
      <div className="gc-controls">
        <div className="gc-field">
          <label htmlFor="gc-seed">Seed</label>
          <div className="gc-seeds" id="gc-seed">
            {data.seeds.map((s, i) => (
              <button
                key={s.seed}
                type="button"
                className={i === seedIdx ? 'on' : ''}
                onClick={() => setSeedIdx(i)}
                aria-pressed={i === seedIdx}
              >
                {s.seed}
              </button>
            ))}
          </div>
        </div>

        <div className="gc-field">
          <label htmlFor="gc-signal">Signal</label>
          <select id="gc-signal" value={signal} onChange={(e) => setSignal(e.target.value)}>
            {SIGNALS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="gc-svg" role="img"
           aria-label={`Training and test accuracy for seed ${seed.seed}, with the firing step and the grokking step marked.`}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={PAD.l} y1={y(g)} x2={W - PAD.r} y2={y(g)} className="gc-grid" />
            <text x={PAD.l - 10} y={y(g) + 4} className="gc-tick" textAnchor="end">{g.toFixed(2)}</text>
          </g>
        ))}

        {[0, 3000, 6000, 9000, 12000].map((s) => (
          <text key={s} x={x(s)} y={H - PAD.b + 20} className="gc-tick" textAnchor="middle">
            {s.toLocaleString('en-US')}
          </text>
        ))}
        <text x={(W + PAD.l - PAD.r) / 2} y={H - 6} className="gc-axis" textAnchor="middle">training step</text>
        <text x={16} y={H / 2} className="gc-axis" textAnchor="middle" transform={`rotate(-90 16 ${H / 2})`}>accuracy</text>

        {/* The lead time, drawn as the band between firing and grokking. */}
        {fire != null && (
          <rect x={x(fire)} y={PAD.t} width={Math.max(x(grok) - x(fire), 0)} height={H - PAD.t - PAD.b} className="gc-band" />
        )}

        <path d={trainPath} className="gc-train" />
        <path d={testPath} className="gc-test" />

        {fire != null && (
          <g>
            <line x1={x(fire)} y1={PAD.t} x2={x(fire)} y2={H - PAD.b} className="gc-fire" />
            <text x={x(fire) + 6} y={PAD.t + 14} className="gc-mark">fired {fire.toLocaleString('en-US')}</text>
          </g>
        )}
        <g>
          <line x1={x(grok)} y1={PAD.t} x2={x(grok)} y2={H - PAD.b} className="gc-grok" />
          <text x={x(grok) + 6} y={PAD.t + 32} className="gc-mark">grokked {grok.toLocaleString('en-US')}</text>
        </g>
      </svg>

      <div className="gc-legend">
        <span><i className="sw train" /> train accuracy</span>
        <span><i className="sw test" /> test accuracy</span>
        <span><i className="sw fire" /> signal fires</span>
        <span><i className="sw grok" /> test accuracy crosses {data.rule.grokThreshold}</span>
      </div>

      <div className="gc-readout">
        {fire == null ? (
          <p className="gc-none">
            This signal never fired on seed {seed.seed} under the rule, so it has no lead time.
          </p>
        ) : (
          <p>
            <strong>{lead! >= 0 ? `${lead!.toLocaleString('en-US')} steps of lead` : `${Math.abs(lead!).toLocaleString('en-US')} steps late`}</strong>
            {' '}on seed {seed.seed}: fired at {fire.toLocaleString('en-US')}, grokking at {grok.toLocaleString('en-US')}.
          </p>
        )}
      </div>

      <figcaption>
        Training and test accuracy for one seed of modular addition, with the step the
        chosen signal fired and the step test accuracy crossed {data.rule.grokThreshold}.
        The shaded band is the lead time. A band to the left of the grokking line is a
        warning that arrived early; a signal that fires after the line arrived late.
        <span className="gc-src">Source: logs/predictor_seed0.csv to predictor_seed7.csv and logs/lead_times.csv</span>
      </figcaption>

      <style>{`
        .gc { margin: 0; }
        .gc-controls { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-end; margin-bottom: 1rem; }
        .gc-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .gc-field label {
          font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted);
        }
        .gc-seeds { display: flex; gap: 0.25rem; }
        .gc-seeds button {
          width: 30px; height: 30px; border-radius: var(--radius);
          border: var(--rule); background: var(--panel); color: var(--muted);
          font-family: var(--font-mono); font-size: 0.75rem; cursor: pointer;
          transition: color .16s ease, border-color .16s ease, background .16s ease;
        }
        .gc-seeds button:hover { color: var(--ink); }
        .gc-seeds button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
        .gc-field select {
          background: var(--panel); color: var(--ink); border: var(--rule);
          border-radius: var(--radius); padding: 0.4rem 0.6rem;
          font-family: var(--font-ui); font-size: 0.8125rem; height: 30px;
        }
        .gc-svg { width: 100%; height: auto; display: block; }
        .gc-grid { stroke: var(--grid); stroke-width: 1; }
        .gc-tick { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); }
        .gc-axis { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); letter-spacing: 0.08em; }
        .gc-band { fill: var(--accent); opacity: 0.1; }
        .gc-train { fill: none; stroke: var(--muted); stroke-width: 2; }
        .gc-test { fill: none; stroke: var(--ink); stroke-width: 2.4; }
        .gc-fire { stroke: var(--accent); stroke-width: 1.6; stroke-dasharray: 4 3; }
        .gc-grok { stroke: var(--verified); stroke-width: 1.6; }
        .gc-mark { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); }
        .gc-legend {
          display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 0.9rem;
          font-size: 0.75rem; color: var(--muted);
        }
        .gc-legend span { display: inline-flex; align-items: center; gap: 0.45rem; }
        .sw { width: 14px; height: 3px; border-radius: 2px; display: inline-block; }
        .sw.train { background: var(--muted); }
        .sw.test { background: var(--ink); }
        .sw.fire { background: var(--accent); }
        .sw.grok { background: var(--verified); }
        .gc-readout { margin-top: 1rem; padding: 0.9rem 1.1rem; border: var(--rule); border-radius: var(--radius); background: var(--panel); }
        .gc-readout p { margin: 0; font-size: 0.9375rem; color: var(--muted); }
        .gc-readout strong { color: var(--accent); font-weight: 600; }
        .gc-none { color: var(--muted); }
        figcaption {
          margin-top: 1rem; font-size: 0.8125rem; color: var(--muted); line-height: 1.6;
          display: flex; flex-direction: column; gap: 0.4rem;
        }
        .gc-src { font-family: var(--font-mono); font-size: 0.6875rem; opacity: 0.8; }
      `}</style>
    </figure>
  );
}
