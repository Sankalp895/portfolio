// Skill groups follow the resume, which is the reference for what is public.
// Rule from the brief: every skill must link to a project that proves it.
// `confirm: true` marks an item still waiting on a check. There are none left.

export type Skill = {
  name: string;
  /** Mission or research slugs that prove this skill. */
  evidence: string[];
  confirm?: boolean;
  /** Set when having no linked project is the settled answer, not an open task. */
  noLink?: boolean;
  note?: string;
};

export type SkillGroup = {
  id: string;
  label: string;
  skills: Skill[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'languages',
    label: 'Languages',
    skills: [
      { name: 'Python', evidence: ['skyscout', 'surrogate-trust-audit', 'inkless', 'inertial-ghost'] },
      { name: 'SQL', evidence: ['complisense'] },
      { name: 'JavaScript', evidence: ['swarm-defence-sim', 'supernova-simulation', 'hirescope'] },
      // On the resume, but no public repo of mine is written in it.
      { name: 'Java', evidence: [], noLink: true, note: 'On the resume. No public project of mine is written in it' },
      { name: 'GLSL', evidence: ['supernova-simulation'] },
    ],
  },
  {
    id: 'ml',
    label: 'ML and deep learning',
    skills: [
      { name: 'PyTorch', evidence: ['surrogate-trust-audit', 'swarm-defence-sim', 'lead-time-is-not-a-detection'] },
      { name: 'TensorFlow', evidence: ['drug-discovery'] },
      { name: 'scikit-learn', evidence: ['global-weather', 'drug-discovery'] },
      { name: 'XGBoost', evidence: ['complisense', 'global-weather'] },
      { name: 'LightGBM', evidence: ['global-weather'] },
      { name: 'SHAP', evidence: ['complisense', 'global-weather'] },
      { name: 'GANs (WGAN-GP)', evidence: ['swarm-defence-sim'] },
      { name: 'TCNs', evidence: ['swarm-defence-sim'] },
      { name: 'Transformers (BERT)', evidence: ['complisense'] },
      { name: 'FNO', evidence: ['surrogate-trust-audit'] },
      { name: 'PINN', evidence: ['surrogate-trust-audit'] },
    ],
  },
  {
    id: 'scientific',
    label: 'Scientific computing',
    skills: [
      { name: 'NumPy', evidence: ['skyscout', 'glcm-texture', 'supernova-simulation'] },
      { name: 'SciPy', evidence: ['skyscout', 'surrogate-trust-audit', 'inertial-ghost'] },
      { name: 'Kalman filtering (ESKF)', evidence: ['skyscout', 'inertial-ghost'] },
      { name: 'Factor graphs', evidence: ['inertial-ghost'] },
      { name: 'IMU pre-integration', evidence: ['inertial-ghost'] },
      { name: 'Spectral methods', evidence: ['surrogate-trust-audit'] },
      { name: 'Crank-Nicolson', evidence: ['surrogate-trust-audit'] },
      { name: 'A* planning', evidence: ['skyscout', 'inertial-ghost'] },
    ],
  },
  {
    id: 'robotics',
    label: 'Robotics and simulation',
    skills: [
      { name: 'URDF / SRDF / SDF', evidence: ['skyscout'] },
      { name: 'build123d CAD', evidence: ['skyscout'] },
      { name: 'Genesis', evidence: ['skyscout'] },
      { name: 'MuJoCo', evidence: ['skyscout'] },
      { name: 'Godot 4', evidence: ['inertial-ghost'] },
      { name: 'Three.js', evidence: ['swarm-defence-sim', 'supernova-simulation'] },
      { name: 'Blender (bpy)', evidence: ['skyscout'] },
      { name: 'OpenCV', evidence: ['inertial-ghost'] },
      { name: 'GLCM', evidence: ['glcm-texture', 'skyscout'] },
      { name: 'Bayesian log-odds mapping', evidence: ['skyscout'] },
    ],
  },
  {
    id: 'llm',
    label: 'LLM and data',
    skills: [
      { name: 'RAG', evidence: ['hirescope', 'complisense'] },
      { name: 'FAISS', evidence: ['hirescope'] },
      { name: 'pgvector', evidence: ['complisense', 'stylepilot'] },
      { name: 'sentence-transformers', evidence: ['hirescope'] },
      { name: 'spaCy', evidence: ['hirescope'] },
      { name: 'OCR (Tesseract)', evidence: ['hirescope', 'stylepilot'] },
    ],
  },
  {
    id: 'backend',
    label: 'Backend and infrastructure',
    skills: [
      { name: 'FastAPI', evidence: ['hirescope', 'stylepilot'] },
      { name: 'Flask', evidence: ['glcm-texture'] },
      { name: 'React', evidence: ['hirescope'] },
      { name: 'PostgreSQL', evidence: ['complisense', 'stylepilot'] },
      { name: 'Neo4j', evidence: ['complisense'] },
      { name: 'Redis', evidence: ['hirescope'] },
      { name: 'SQLAlchemy', evidence: ['stylepilot'] },
      { name: 'Docker', evidence: ['hirescope', 'stylepilot'] },
      { name: 'Apache Airflow', evidence: ['stylepilot'] },
      { name: 'Azure', evidence: ['complisense'] },
      { name: 'Git', evidence: ['skyscout', 'surrogate-trust-audit'] },
      { name: 'pytest', evidence: ['surrogate-trust-audit'] },
    ],
  },
  {
    id: 'research',
    label: 'Research practice',
    skills: [
      { name: 'Pre-registration', evidence: ['surrogate-trust-audit', 'lead-time-is-not-a-detection'] },
      { name: 'Null models', evidence: ['surrogate-trust-audit'] },
      { name: 'Multi-seed studies', evidence: ['lead-time-is-not-a-detection'] },
      { name: 'Convergence tests', evidence: ['surrogate-trust-audit'] },
      { name: 'Filter consistency (NEES)', evidence: ['skyscout'] },
    ],
  },
];

export const learning = [
  { name: 'Cybersecurity', detail: 'TryHackMe track' },
  { name: 'LLM systems engineering', detail: 'Evals, caching, serving' },
  { name: 'German', detail: 'A2 target' },
];

export const allSkills = skillGroups.flatMap((g) =>
  g.skills.map((s) => ({ ...s, group: g.id, groupLabel: g.label }))
);
