/**
 * Redraw the figures whose default matplotlib styling clashes with the site.
 *
 * Same data, read straight from the result CSVs. The output is SVG that uses the
 * site's colour tokens, so one file works in both themes and stays crisp at any
 * zoom. Nothing here changes what the data says.
 *
 *   node scripts/make-figures.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = 'results(Grokking)';
const OUT = 'src/generated/figures';
mkdirSync(OUT, { recursive: true });

const csv = (p) => {
  const lines = readFileSync(`${SRC}/${p}`, 'utf8').trim().split(/\r?\n/);
  const head = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const cells = l.split(',');
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = (n) => Number(n).toLocaleString('en-US');

// Shared styling. Colours are CSS variables, so the figure follows the theme.
const STYLE = `
  .bg { fill: none; }
  .ax { stroke: var(--grid); stroke-width: 1; }
  .tk { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); }
  .lb { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); letter-spacing: 0.08em; }
  .ttl { font-family: var(--font-ui); font-size: 14px; fill: var(--ink); font-weight: 600; }
  .train { fill: none; stroke: var(--muted); stroke-width: 2; }
  .test { fill: none; stroke: var(--ink); stroke-width: 2.4; }
  .mk-fire { stroke: var(--accent); stroke-width: 1.6; stroke-dasharray: 4 3; }
  .mk-grok { stroke: var(--verified); stroke-width: 1.6; }
  .note { font-family: var(--font-mono); font-size: 10.5px; fill: var(--muted); }
  .bar { fill: var(--accent); }
  .bar-dim { fill: var(--muted); opacity: 0.4; }
  .zero { stroke: var(--ink); stroke-width: 1.2; }
  .dot { fill: var(--accent); }
  .dot-late { fill: var(--warn); }
  .name { font-family: var(--font-ui); font-size: 12px; fill: var(--ink); }
  .val { font-family: var(--font-mono); font-size: 11px; fill: var(--muted); }
`;

// The SVGs are inlined into the page, where their <style> applies to the whole
// document. Every class gets an rf- prefix so a figure label can never restyle
// the page (it once matched the lightbox, which is also .lb).
const scope = (css) => css.replace(/\.([a-z][a-z-]*)\s*\{/g, '.rf-$1 {');
const scopeBody = (svg) => svg.replace(/class="([^"]+)"/g, (_, c) => `class="${c.split(' ').map((x) => 'rf-' + x).join(' ')}"`);

const wrap = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<style>${scope(STYLE)}</style>
${scopeBody(body)}
</svg>`;

// ---------------------------------------------------------------- curve
{
  const rows = csv('logs/single.csv');
  const W = 940, H = 420, P = { l: 58, r: 22, t: 34, b: 48 };
  const steps = rows.map((r) => Number(r.step));
  const maxStep = Math.max(...steps);

  // Log x, because everything interesting happens before step 10,000.
  const lx = (s) => Math.log10(Math.max(s, 1));
  const maxL = lx(maxStep);
  const x = (s) => P.l + (lx(s) / maxL) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - v) * (H - P.t - P.b);

  const line = (key) =>
    rows.map((r, i) => `${i ? 'L' : 'M'}${x(Number(r.step)).toFixed(1)} ${y(Number(r[key])).toFixed(1)}`).join(' ');

  const GROK = 4100;   // test accuracy crossing 0.5, logs/lead_times.csv seed 0
  const MEM = 500;     // train accuracy crossing, logs/single.json

  let b = '';
  for (const g of [0, 0.25, 0.5, 0.75, 1]) {
    b += `<line class="ax" x1="${P.l}" y1="${y(g)}" x2="${W - P.r}" y2="${y(g)}"/>`;
    b += `<text class="tk" x="${P.l - 9}" y="${y(g) + 4}" text-anchor="end">${g.toFixed(2)}</text>`;
  }
  for (const s of [1, 10, 100, 1000, 10000, 40000]) {
    b += `<text class="tk" x="${x(s)}" y="${H - P.b + 19}" text-anchor="middle">${fmt(s)}</text>`;
  }
  b += `<text class="lb" x="${(W + P.l - P.r) / 2}" y="${H - 8}" text-anchor="middle">training step (log scale)</text>`;
  b += `<text class="lb" x="15" y="${H / 2}" text-anchor="middle" transform="rotate(-90 15 ${H / 2})">accuracy</text>`;
  b += `<text class="ttl" x="${P.l}" y="20">(a + b) mod 97, seed 0</text>`;

  b += `<rect x="${x(MEM)}" y="${P.t}" width="${x(GROK) - x(MEM)}" height="${H - P.t - P.b}" fill="var(--accent)" opacity="0.08"/>`;
  b += `<path class="train" d="${line('train_acc')}"/>`;
  b += `<path class="test" d="${line('test_acc')}"/>`;
  b += `<line class="mk-fire" x1="${x(MEM)}" y1="${P.t}" x2="${x(MEM)}" y2="${H - P.b}"/>`;
  b += `<text class="note" x="${x(MEM) + 6}" y="${P.t + 14}">memorised ${fmt(MEM)}</text>`;
  b += `<line class="mk-grok" x1="${x(GROK)}" y1="${P.t}" x2="${x(GROK)}" y2="${H - P.b}"/>`;
  b += `<text class="note" x="${x(GROK) + 6}" y="${P.t + 30}">grokked ${fmt(GROK)}</text>`;
  b += `<text class="note" x="${x(MEM) + 6}" y="${H - P.b - 10}">${fmt(GROK - MEM)} steps of memorising without generalising</text>`;

  writeFileSync(`${OUT}/grokking-curve.svg`, wrap(W, H, b, 'Train and test accuracy over 40,000 steps'));
  console.log('grokking-curve.svg', rows.length, 'points');
}

// ------------------------------------------------------------ lead times
{
  const rows = csv('logs/lead_times.csv');
  const signals = [...new Set(rows.map((r) => r.signal))];
  const W = 940, ROW = 46, P = { l: 210, r: 80, t: 30, b: 46 };
  const H = P.t + signals.length * ROW + P.b;

  // A blank lead_time means the signal never fired. Number('') is 0, so blanks
  // must become NaN here or they would be drawn as a lead of zero.
  const lead = (r) => (r.lead_time === '' ? NaN : Number(r.lead_time));
  const leads = rows.map(lead).filter((v) => Number.isFinite(v));
  const lo = Math.min(0, ...leads), hi = Math.max(...leads);
  const x = (v) => P.l + ((v - lo) / (hi - lo)) * (W - P.l - P.r);

  let b = `<text class="ttl" x="${P.l - 200}" y="18">Lead time per seed, modular addition</text>`;
  for (const t of [0, 1000, 2000, 3000, 4000, 5000]) {
    if (t < lo || t > hi) continue;
    b += `<line class="ax" x1="${x(t)}" y1="${P.t}" x2="${x(t)}" y2="${H - P.b}"/>`;
    b += `<text class="tk" x="${x(t)}" y="${H - P.b + 18}" text-anchor="middle">${fmt(t)}</text>`;
  }
  b += `<line class="zero" x1="${x(0)}" y1="${P.t}" x2="${x(0)}" y2="${H - P.b}"/>`;
  b += `<text class="lb" x="${(W + P.l - P.r) / 2}" y="${H - 8}" text-anchor="middle">steps of warning before the test-accuracy jump</text>`;

  signals.forEach((sig, i) => {
    const cy = P.t + i * ROW + ROW / 2;
    const mine = rows.filter((r) => r.signal === sig);
    const vals = mine.map(lead).filter(Number.isFinite);
    b += `<text class="name" x="${P.l - 12}" y="${cy + 4}" text-anchor="end">${esc(sig)}</text>`;
    if (!vals.length) {
      b += `<text class="val" x="${x(0) + 10}" y="${cy + 4}">never fired on any of the 8 seeds</text>`;
      return;
    }
    const mean = vals.reduce((a, c) => a + c, 0) / vals.length;
    b += `<line x1="${x(Math.min(...vals))}" y1="${cy}" x2="${x(Math.max(...vals))}" y2="${cy}" stroke="var(--muted)" stroke-width="1.5" opacity="0.4"/>`;
    for (const v of vals) {
      b += `<circle class="${v < 0 ? 'dot-late' : 'dot'}" cx="${x(v)}" cy="${cy}" r="4.5" opacity="0.85"/>`;
    }
    b += `<text class="val" x="${W - P.r + 10}" y="${cy + 4}">${vals.filter((v) => v > 0).length}/8</text>`;
  });

  b += `<text class="note" x="${P.l}" y="${H - P.b + 36}">each dot is one seed; red dots fired after the jump, not before</text>`;

  writeFileSync(`${OUT}/lead-times.svg`, wrap(W, H, b, 'Lead time per signal across eight seeds'));
  console.log('lead-times.svg', signals.length, 'signals');
}

// --------------------------------------------------------------- margins
{
  const rows = csv('tables/primary_h4.csv');
  const W = 940, ROW = 62, P = { l: 250, r: 90, t: 34, b: 50 };
  const H = P.t + rows.length * ROW + P.b;

  const los = rows.map((r) => Number(r.ci_low));
  const his = rows.map((r) => Number(r.ci_high));
  const lo = Math.min(...los, 0) * 1.08, hi = Math.max(...his, 0) + 0.06;
  const x = (v) => P.l + ((v - lo) / (hi - lo)) * (W - P.l - P.r);

  const LABEL = {
    residual_supervised: 'PDE residual',
    ensemble_supervised: 'Seed-ensemble disagreement',
    embedding_probe: 'Frozen-feature embedding probe',
  };

  let b = `<text class="ttl" x="${P.l - 240}" y="18">Margin against the input-only null model, six most shifted cells</text>`;
  for (const t of [-1, -0.75, -0.5, -0.25, 0]) {
    if (t < lo || t > hi) continue;
    b += `<line class="ax" x1="${x(t)}" y1="${P.t}" x2="${x(t)}" y2="${H - P.b}"/>`;
    b += `<text class="tk" x="${x(t)}" y="${H - P.b + 18}" text-anchor="middle">${t}</text>`;
  }
  b += `<line class="zero" x1="${x(0)}" y1="${P.t}" x2="${x(0)}" y2="${H - P.b}"/>`;
  b += `<text class="note" x="${x(0) + 8}" y="${P.t - 8}">0 = ties the null</text>`;
  b += `<text class="lb" x="${(W + P.l - P.r) / 2}" y="${H - 8}" text-anchor="middle">margin in Spearman correlation (negative means the null did better)</text>`;

  rows.forEach((r, i) => {
    const cy = P.t + i * ROW + ROW / 2;
    const m = Number(r.margin), cl = Number(r.ci_low), ch = Number(r.ci_high);
    b += `<text class="name" x="${P.l - 12}" y="${cy}" text-anchor="end">${esc(LABEL[r.indicator] ?? r.indicator)}</text>`;
    b += `<text class="val" x="${P.l - 12}" y="${cy + 16}" text-anchor="end">${esc(r.verdict)}</text>`;
    b += `<rect x="${x(Math.min(m, 0))}" y="${cy - 9}" width="${Math.abs(x(m) - x(0))}" height="18" rx="3" class="bar" opacity="0.9"/>`;
    b += `<line x1="${x(cl)}" y1="${cy}" x2="${x(ch)}" y2="${cy}" stroke="var(--ink)" stroke-width="1.6"/>`;
    for (const e of [cl, ch]) {
      b += `<line x1="${x(e)}" y1="${cy - 6}" x2="${x(e)}" y2="${cy + 6}" stroke="var(--ink)" stroke-width="1.6"/>`;
    }
    b += `<text class="val" x="${W - P.r + 10}" y="${cy + 4}">${m.toFixed(3)}</text>`;
  });

  writeFileSync(`${OUT}/null-margins.svg`, wrap(W, H, b, 'Margin of each indicator against the null model with confidence intervals'));
  console.log('null-margins.svg', rows.length, 'indicators');
}
