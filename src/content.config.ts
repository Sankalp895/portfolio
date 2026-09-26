import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// A missing required field fails the build instead of shipping a blank. Rule 4 of the brief.

// A link is in exactly one of three states, and the site says which:
//   href       the link is live
//   confirm    the URL still has to be supplied, shown as a TODO
//   notPublic  there is no public URL and there is not going to be one
const link = z
  .object({
    label: z.string(),
    href: z.string().optional(),
    confirm: z.boolean().optional(),
    notPublic: z.boolean().optional(),
  })
  .refine((l) => Boolean(l.href) || l.confirm === true || l.notPublic === true, {
    message: 'A link needs an href, or confirm: true, or notPublic: true.',
  })
  .refine((l) => !(l.href && l.notPublic), {
    message: 'A link cannot have an href and also be marked notPublic.',
  });

const proofPoint = z.object({
  value: z.string(),
  label: z.string(),
  /** Where the number comes from: a repo path, a figure, a paper section. */
  source: z.string().optional(),
});

const missions = defineCollection({
  loader: glob({ base: './src/content/missions', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    period: z.string(),
    categories: z.array(z.enum(['Robotics', 'Simulation', 'Research', 'ML', 'Backend', 'Security'])).min(1),
    flagship: z.boolean().default(false),
    order: z.number(),
    status: z.enum(['verified', 'under-review', 'planned', 'shipped']),
    /** The headline number on the front of the card. */
    headline: proofPoint,
    /** The back of the card: what checking a second metric showed. */
    secondMetric: z.object({
      first: z.string(),
      second: z.string(),
    }),
    proof: z.array(proofPoint).min(1),
    stack: z.array(z.string()).min(1),
    links: z.array(link).default([]),
    /** Facts the brief marks "(confirm)". Rendered as a visible TODO. */
    confirm: z.array(z.string()).default([]),
    cover: z.string().optional(),
  }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    order: z.number(),
    status: z.enum(['under-review', 'preprint', 'published', 'in-preparation']),
    statusDetail: z.string(),
    venue: z.string(),
    year: z.string(),
    /** One paragraph, plain English, no jargon without a gloss. */
    plainAbstract: z.string(),
    /** The result in one sentence, for the hero and the page description. */
    oneLine: z.string(),
    /** A key in the paper's figure map, or "inline:<name>" for a redrawn SVG. */
    heroFigure: z.string(),
    keyResults: z.array(proofPoint).min(1),
    stack: z.array(z.string()).min(1),
    links: z.array(link).default([]),
    bibtex: z.string(),
    figure: z.string().optional(),
    figureCaption: z.string().optional(),
    confirm: z.array(z.string()).default([]),
  }),
});

const rigorLog = defineCollection({
  loader: glob({ base: './src/content/rigor-log', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    project: z.string(),
    /** Slug of the mission or paper this came from, for the cross-link. */
    projectSlug: z.string().optional(),
    /** The file in the repository where this can be checked. */
    source: z.string().optional(),
    firstMetric: z.string(),
    secondMetric: z.string(),
    fix: z.string(),
    lesson: z.string(),
    severity: z.enum(['silent', 'loud']).default('silent'),
    confirm: z.array(z.string()).default([]),
  }),
});

export const collections = { missions, research, 'rigor-log': rigorLog };
