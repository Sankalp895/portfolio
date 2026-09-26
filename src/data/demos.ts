/**
 * Demo recordings, matched to the project each one shows.
 * Sources live in ../portfolio/vid and are transcoded into public/media/demos.
 */

export type Demo = {
  /** Mission slug this demo belongs to. */
  slug: string;
  title: string;
  caption: string;
  /** Source file this was transcoded from, so the pairing stays checkable. */
  source: string;
  durationLabel: string;
};

export const demos: Demo[] = [
  {
    slug: 'skyscout',
    title: 'SkyScout: the scout mission',
    caption: 'The drone flies its survey over the procedural Mars terrain and builds the hazard map the rover plans over.',
    source: 'skyscout_scout_mission_(Main).mp4',
    durationLabel: '0:50',
  },
  {
    slug: 'swarm-defence-sim',
    title: 'Adversarial swarm, in 3D',
    caption: 'The drone-swarm simulator running, with the threat classes moving in the airspace the detector watches.',
    source: 'SWarm_drone.mp4',
    durationLabel: '0:26',
  },
  {
    slug: 'inertial-ghost',
    title: 'Inertial Ghost: flying without GPS',
    caption: 'Navigation continuing after the GPS fix is gone, with the estimated track drawn against the truth.',
    source: 'No_gps movement.mp4',
    durationLabel: '0:34',
  },
];

export const demoFor = (slug: string) => demos.find((d) => d.slug === slug);
