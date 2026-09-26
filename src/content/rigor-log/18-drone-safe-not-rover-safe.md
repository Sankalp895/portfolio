---
title: 'Drone-safe is not rover-safe'
order: 11
project: SkyScout
projectSlug: skyscout
source: 'brain/b5_a1_rover_costmap.json'
severity: silent
firstMetric: 'The drone had mapped the region and the hazard map scored well against ground truth, so the routes it handed down should be drivable.'
secondMetric: 'Running the rover traversability model over the same cells found 888 that the rover cannot cross and the drone can fly over without noticing. 427 of them fail on step height alone, which a slope-only check cannot see.'
fix: 'Give the rover its own cost map with its own limits, and plan over that rather than over the drone view.'
lesson: 'A map is safe for the vehicle it was built for. The drone had zero cells blocked that the rover could pass, which is the asymmetry: the aerial view is optimistic in exactly one direction.'
---
