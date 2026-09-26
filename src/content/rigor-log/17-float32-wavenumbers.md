---
title: 'A float32 wavenumber hiding inside a float64 field'
order: 10
project: surrogate-trust-audit
projectSlug: surrogate-trust-audit
source: 'REPORT.md, section 2.2'
severity: silent
firstMetric: 'Spectral derivatives looked fine at a loose tolerance, and the field was float64 throughout.'
secondMetric: 'A test at a 1e-10 tolerance in float64 failed. torch.fft.rfftfreq follows the default dtype, so it handed back float32 wavenumbers even for a float64 field, and squaring them cost two significant digits.'
fix: 'Build the wavenumbers at float64 and cast to the complex dtype at the end.'
lesson: 'Precision loss does not raise anything. Accuracy went from about 1e-5 to 3.3e-13 once the tolerance was tight enough to notice.'
---
