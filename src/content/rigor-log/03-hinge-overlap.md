---
title: 'Nine design changes, nine passes, one interfering hinge'
order: 3
project: SkyScout
projectSlug: skyscout
source: 'docs/design/, and the repo checkers in scripts/'
severity: silent
firstMetric: 'A clearance check measured the distance between the hinge parts and passed. It passed on nine straight design changes.'
secondMetric: 'A boolean intersection test, asking whether the two solids actually share volume, found the hinges had been interfering the whole time.'
fix: 'Replace the distance check with a solid overlap test on the real geometry.'
lesson: 'Nine passes of a weak test is not nine pieces of evidence. It is one blind spot, repeated nine times.'
---
