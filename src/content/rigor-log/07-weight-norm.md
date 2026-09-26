---
title: 'weight_norm fired on zero of eight seeds'
order: 7
project: 'A Lead Time Is Not a Detection'
projectSlug: lead-time-is-not-a-detection
source: 'Paper, pre-registered firing rule: 5 sigma over 3 checkpoints'
severity: loud
firstMetric: 'weight_norm is cited as an early-warning signal for grokking, with a reported lead time.'
secondMetric: 'Under a detection rule fixed before I looked at the results, weight_norm fired on 0 of 8 seeds. The Fourier signal, under the same rule, led on 8 of 8 by a median of about 2,600 steps.'
fix: 'Report the signal as failing the rule, rather than loosening the rule until it passes.'
lesson: 'A lead time you can only produce after choosing the threshold is not a detection. That sentence became the title of the paper.'
---
