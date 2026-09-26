// Slug index used by the skills evidence graph and by cross-links.
// Missions and research live in src/content. These entries are only the ones that are
// experience rather than a project of their own.

export type ProjectRef = { slug: string; title: string; href: string; kind: 'mission' | 'research' | 'work' };

export const workRefs: ProjectRef[] = [
  { slug: 'stylepilot', title: 'StylePilot (Product Manager Accelerator)', href: '/about/#experience', kind: 'work' },
];
