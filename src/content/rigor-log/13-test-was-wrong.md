---
title: 'The test was wrong and the solver was right'
order: 1
project: surrogate-trust-audit
projectSlug: surrogate-trust-audit
source: 'REPORT.md, section 2.4'
severity: silent
firstMetric: 'A test asserted that the residual of an exact reference step stays below 1e-3. It measured 5.3e-3, so the solver looked broken.'
secondMetric: 'Refinement showed the residual falls by exactly 4.00x per halving of the timestep, which is second-order convergence. I derived the closed-form law it should follow and it matched to within 1%: predicted 3.95e-3 against 3.9625e-3 measured. The solver was right and my threshold was a number with no theoretical basis.'
fix: 'Replace the arbitrary threshold with two stronger tests: that the floor converges at order 2, and that its magnitude matches the derived law.'
lesson: 'When a test fails, one of two things is wrong and it is not always the code. No tolerance was loosened to make anything pass.'
---
