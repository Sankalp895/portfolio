# Sankalp Singh: portfolio

A mission-control console for work whose real subject is measurement. Every project shows a
result and the second, independent metric that tested it.

Built from `PORTFOLIO_BRIEF.md`, which is the single source of truth for every fact on the site.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview  # serve the built site
```

Node 22 or newer.

## How it is put together

| Layer | Choice |
| --- | --- |
| Framework | Astro 7, static output, React islands only where something is interactive |
| Styling | Tailwind 4 plus CSS variables for the two themes |
| 3D | Three.js, imported dynamically so it is never downloaded on phones or under reduced motion |
| Graph | d3-force, rendered as SVG |
| Palette and console | Hand written, no dependency |

Two deliberate departures from the brief's stack table, both to keep JavaScript down:
react-three-fiber and drei were dropped in favour of plain Three.js, and `cmdk` was dropped in
favour of a small hand written palette.

## The rule about facts

Components hold no facts. Everything lives in:

```
src/content/missions/*.mdx     one file per project
src/content/research/*.mdx     one file per paper
src/content/rigor-log/*.md     one file per caught bug
src/data/*.ts                  profile, experience, skills, now
```

All of it is validated by Zod schemas in `src/content.config.ts`. A missing required field
fails the build instead of shipping a blank. Anything the brief marks "(confirm)" carries a
`confirm` field and renders as a visible amber TODO, so nothing unverified goes out quietly.

## Themes

Mission mode (dark) is a telemetry HUD. Paper mode (light) is an arXiv-style page. The choice
follows the system preference on a first visit and is then remembered in `localStorage`.

## Deploying to Vercel

```bash
npm i -g vercel
vercel login
vercel link
vercel --prod
```

Vercel detects Astro and needs no configuration. Add the custom domain in the project settings
once you have one.

## Still to supply

See section 8 of `PORTFOLIO_BRIEF.md`. The short version:

- `public/resume/Sankalp_Singh_CV.pdf`. Until it exists, the resume page shows a TODO instead
  of a broken download link.
- A square portrait at `public/media/portrait.jpg`.
- Repository URLs for each mission, in the `links` block of its content file.
- Project media in `public/media/<project>/`.
- The InterpScience decision, due 29 September 2026.
