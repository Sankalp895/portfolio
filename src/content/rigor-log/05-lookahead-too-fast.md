---
title: 'The controller flew the right shape 3.4x too fast'
order: 13
project: SkyScout
projectSlug: skyscout
source: 'brain/b3_step3_truth.json'
severity: silent
firstMetric: 'The drone followed the survey path and the path-following error looked acceptable.'
secondMetric: 'Comparing the commanded speed against the intended survey speed showed the lookahead controller was flying 3.4 times too fast.'
fix: 'Correct the lookahead so the commanded speed matches the survey speed.'
lesson: 'Tracking error tells you the shape is right. It says nothing about the pace, and a survey flown too fast is a survey that missed things.'
---
