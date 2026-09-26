// Every value here comes from Section 2 of PORTFOLIO_BRIEF.md and the resume, which is
// the reference for what is public. Nothing is invented.
// Items the brief marks "(confirm)" carry a `confirm` flag and render with a visible TODO marker.

export const profile = {
  name: 'Sankalp Singh',
  shortName: 'S',
  identityLine:
    'I build simulations at the edge of machine learning and mathematical modelling, then try hard to prove them wrong.',
  /** The PROFILE paragraph from the resume PDF, word for word. */
  resumeProfile:
    'I build simulations and then test whether their results hold up. Most of my work sits between machine learning and mathematical modelling: tracking a drone without GPS, simulating robots on Mars, and asking when a neural network’s answer can be trusted. I have written two research preprints, and one of them reports a negative result. I am applying for an M.Sc. in computational science or computer science, starting 2027.',
  role: 'Simulation, estimation and machine learning',
  degree:
    'B.Tech, Artificial Intelligence and Data Science, GGSIPU Delhi. Awarded May 2026 (provisional certificate). First two years were mathematics and physics.',
  degreeShort: 'B.Tech, AI and Data Science, GGSIPU Delhi. Awarded May 2026 (provisional certificate).',
  goal: 'Specialist at the intersection of machine learning and mathematical modelling.',
  nextStep:
    'International M.Sc. for 2027 in Computational Science, Scientific Computing, CS or Robotics. Germany, Netherlands, Norway, USA.',
  location: 'Delhi, IN',
  status: 'Open to M.Sc. 2027 and internships',
  currentMission: 'M.Sc. 2027',
  email: 'sankalp895@gmail.com',
  github: 'https://github.com/Sankalp895',
  githubHandle: 'github.com/Sankalp895',
  linkedin: 'https://linkedin.com/in/sankalp-singh-420b3a246',
  linkedinHandle: 'linkedin.com/in/sankalp-singh-420b3a246',
  resumePath: '/resume/Sankalp_Singh_CV.pdf',
} as const;

export const spokenLanguages = [
  { name: 'Hindi', level: 'Native' },
  { name: 'English', level: 'IELTS 8.0' },
  { name: 'German', level: 'Learning, A2 target' },
] as const;

export const certifications = [
  { name: 'Aeromodelling Certification', note: 'Where the flying started' },
] as const;

// The brief's note: the resume also files the Prodigal AI internship and the Product Manager
// Accelerator role under certifications. They read as experience, so they live in experience.ts.

export const audience = [
  'Master\u2019s admission committees',
  'Research supervisors',
  'ML, robotics and autonomy recruiters',
] as const;
