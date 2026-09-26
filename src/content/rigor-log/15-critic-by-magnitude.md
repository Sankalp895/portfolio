---
title: 'The critic was winning for the wrong reason'
order: 4
project: 'Adversarial Swarm Defence Sim'
projectSlug: swarm-defence-sim
source: 'config.yaml, gan.generator.output_scale'
severity: silent
firstMetric: 'The GAN was training. The critic separated real swarms from generated ones and the losses moved.'
secondMetric: 'It was separating them by magnitude alone. Real normalised features span about -2.78 to +5.47, and a bare Tanh output only reaches -1 to +1, under 40% of that range. The critic never had to look at how a swarm moves.'
fix: 'Scale the generator output by 6.0 so it can reach the real support, and record the reason next to the value.'
lesson: 'A discriminator that is winning tells you it found a difference, not that it found the difference you care about. Run 1 diverged and mode collapsed because of it.'
---
