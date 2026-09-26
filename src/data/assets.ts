import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Build-time checks for files the brief says have to be supplied.
 * A missing asset renders as a visible TODO instead of a broken link.
 *
 * This used to resolve the directory from import.meta.url, which pointed into dist/
 * once Vite had bundled the module. The checks then returned false for files that
 * were sitting right there, and the site quietly showed a TODO instead of the file.
 * The second metric caught it: the build passed, but the rendered HTML still said
 * "Photo to add" with the photo in place.
 */
const publicDir = join(process.cwd(), 'public');

if (!existsSync(publicDir)) {
  // If this ever fires, the working directory is not the project root and every
  // check below would silently be false. Fail loudly instead.
  throw new Error(`Cannot find the public directory at ${publicDir}. Asset checks would all be wrong.`);
}

export const hasResumePdf = existsSync(join(publicDir, 'resume', 'Sankalp_Singh_CV.pdf'));
export const hasPhoto = existsSync(join(publicDir, 'media', 'portrait.jpg'));
