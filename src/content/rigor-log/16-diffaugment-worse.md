---
title: 'Two proven techniques made it worse'
order: 5
project: 'Adversarial Swarm Defence Sim'
projectSlug: swarm-defence-sim
source: 'config.yaml, gan.discriminator.minibatch_std'
severity: loud
firstMetric: 'Minibatch standard deviation and DiffAugment are established GAN stabilisers with published results behind them, so adding them should have delayed mode collapse.'
secondMetric: 'I measured when collapse actually arrived. With them, epoch 55. Without them, epoch 145. On a 560-sample dataset of 10 features by 99 timesteps they were a clear net negative.'
fix: 'Disable both, and leave the code in the repository with the measurement written beside the switch so the decision can be revisited at a larger data scale.'
lesson: 'A technique proven on image GANs with far more data is not proven on mine. Measuring the thing I was about to assume cost one run and saved the rest.'
---
