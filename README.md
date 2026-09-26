# Sankalp Singh: portfolio (v2)

A second take on the portfolio, built on the Apple-Style Portfolio template as a
visual shell with my own content layer and routes underneath it.

The content source of truth lives in the sibling `portfolio/` project, and is copied
here as-is: `src/content.config.ts` (Zod schemas), `src/content/` and `src/data/`.
Every fact on this site comes from there. `PORTFOLIO_BRIEF.md` in that project sets
the rules: no invented numbers, simple English, no em dashes.

## Run it

```bash
npm install
npm run dev
npm run build
npm run preview -- --host
```

Node 22 or newer.

## Stack

Astro 7, React 19, Tailwind 4, GSAP for animation, Three.js for the survey hero,
all upgraded from the template's pinned versions. `npm audit` reports 0 vulnerabilities.

## Credit and licence

Built on [Apple-Style Portfolio](https://github.com/larry-xue/apple-style-portfolio)
by Yujian (Larry) Xue, MIT licensed. The original `LICENSE` is kept in this repository
as the licence requires, and the footer credits the template on every page.

My own content, copy and images are not covered by that licence.
