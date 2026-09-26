---
title: 'The asset check that quietly said no'
order: 15
project: 'This site'
source: 'src/data/assets.ts'
severity: silent
firstMetric: 'The build passed, every page rendered, and the resume and portrait checks reported that neither file was there.'
secondMetric: 'Both files were sitting in public/. The check resolved its directory from import.meta.url, which points into dist/ once Vite has bundled the module, so it was testing a path that never exists. The rendered HTML still said "Photo to add" with the photo in place.'
fix: 'Resolve from process.cwd(), and throw if the public directory itself is missing so a bad path fails the build instead of failing quietly.'
lesson: 'A check that can only answer no is not a check. This one had been wrong since the day I wrote it and the build never once complained.'
---
