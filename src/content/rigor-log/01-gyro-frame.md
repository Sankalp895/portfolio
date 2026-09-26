---
title: 'The gyroscope was in the wrong frame, 187x wrong'
order: 9
project: SkyScout
projectSlug: skyscout
source: 'brain/b2_step1_imu.json'
severity: silent
firstMetric: 'Position error over the run looked fine, so the gyroscope integration looked fine.'
secondMetric: 'A test aimed only at the frame convention, which axis set the angular rates are measured in, came back 187 times off.'
fix: 'Correct the frame convention, then keep the isolated test in the suite so the same mistake cannot come back quietly.'
lesson: 'A healthy end-to-end number can hide a wrong sign or a wrong frame. Test the convention on its own, where nothing else can compensate for it.'
confirm:
  - 'Add the exact before and after numbers, and name which frame was wrong.'
---
