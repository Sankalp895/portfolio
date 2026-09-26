---
title: 'The deliberately dumb baseline beat everything'
order: 6
project: surrogate-trust-audit
projectSlug: surrogate-trust-audit
source: 'PREREGISTRATION.md and results/tables/'
severity: loud
firstMetric: 'Trust signals for a neural PDE surrogate, a fast learned stand-in for a physics solver, looked like they were detecting when the surrogate was wrong.'
secondMetric: 'A matched-capacity null model that sees only the input, registered as the primary comparison before any results, beat every trust signal tested.'
fix: 'Report the negative result, publish the code and the full audit trail, and do not quietly retire the null.'
lesson: 'Register the dumb baseline before you run anything. Choose it afterwards and you will choose a weak one without noticing you did.'
---
