---
title: 'Parsing cleanly proves almost nothing'
order: 2
project: SkyScout
projectSlug: skyscout
source: 'scripts/check-robot-descriptions.py'
severity: silent
firstMetric: 'The robot description files parsed without error, and the bundled SDF validator passed them.'
secondMetric: 'Three separate faults were live at once: a mesh URI using a scheme the consumer could not resolve, a mesh pointing at a file that was never modelled, and link and joint names that collide. The second was hidden by the first, because an unresolvable scheme is silently skipped by the existence check.'
fix: 'Write a dedicated integrity checker and run it before and after every export. It exits non-zero on error, so it cannot be ignored.'
lesson: 'A file that parses is a file the parser understood, not a file that is correct. The name collision is legal in URDF and invalid in SDF, so even a valid file can be wrong for its destination.'
---
