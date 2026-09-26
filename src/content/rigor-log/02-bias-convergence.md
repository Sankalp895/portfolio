---
title: 'Proving the filter was right, not just quiet'
order: 12
project: SkyScout
projectSlug: skyscout
source: 'brain/b2_step4_correct.json'
severity: loud
firstMetric: 'Dead reckoning drifted 10.9 m in 14.4 s. After the ESKF went in the drift was gone, so the filter looked correct.'
secondMetric: 'I checked whether the estimated sensor biases converged to the true biases I had injected into the simulation. They did.'
fix: 'Make bias convergence the pass criterion, not the drift number.'
lesson: 'A small position error can come from a filter cancelling two separate mistakes against each other. Recovering a hidden value you planted yourself is much harder to fake.'
---
