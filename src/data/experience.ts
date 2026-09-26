// Section 2, "Experience (newest first)". Facts only.

export type Experience = {
  role: string;
  org: string;
  location: string;
  start: string;
  end: string;
  highlights: string[];
  stack: string[];
};

export const experience: Experience[] = [
  {
    role: 'Backend Developer / ML',
    org: 'Product Manager Accelerator',
    location: 'USA, remote',
    start: 'Sep 2025',
    end: 'Jan 2026',
    highlights: [
      'Built the StylePilot AI fashion platform: a PostgreSQL schema with 8+ models in SQLAlchemy, and a FastAPI backend.',
      'Added pgvector similarity search and a computer vision pipeline using Gemini, SAM and CLIP.',
      'Shipped a recommender and a RAG chatbot on top of it.',
      'The team placed 2nd at the showcase.',
    ],
    stack: ['PostgreSQL', 'SQLAlchemy', 'FastAPI', 'pgvector', 'Gemini API', 'SAM', 'CLIP', 'RAG'],
  },
  {
    role: 'AI/ML Intern',
    org: 'Prodigal AI',
    location: 'Delhi',
    start: 'Jul 2025',
    end: 'Aug 2025',
    highlights: [
      'Dockerised a startup health-scoring app built in Streamlit.',
      'Built RAG and OCR pipelines.',
      'Wrote Apache Airflow workflows, in a team of four.',
    ],
    stack: ['Docker', 'Streamlit', 'RAG', 'OCR', 'Apache Airflow'],
  },
  {
    role: 'Student Research Intern, AI for Drug Discovery',
    org: 'GGSIPU',
    location: 'Delhi',
    start: 'May 2024',
    end: 'Jun 2024',
    highlights: [
      'Led the machine learning work in a team of five.',
      'Built RDKit molecular fingerprints for candidate compounds.',
      'Trained Random Forest and ANN models to predict bioactivity for colon-cancer compounds.',
    ],
    stack: ['RDKit', 'Random Forest', 'ANN', 'scikit-learn'],
  },
];

export type TimelineEntry = {
  year: string;
  title: string;
  body: string;
  kind: 'study' | 'work' | 'build' | 'research' | 'plan';
};

// Dates below are only the ones stated in Section 2. Nothing between them is invented.
export const timeline: TimelineEntry[] = [
  {
    year: '2022',
    title: 'Started the B.Tech, two years of maths and physics',
    body:
      'The AI and Data Science degree at GGSIPU Delhi opens with mathematics and physics. That is the part I kept using later: linear algebra behind the filters, rigid-body mechanics behind the drone.',
    kind: 'study',
  },
  {
    year: '2024',
    title: 'First research internship: AI for drug discovery',
    body:
      'May to June at GGSIPU. I led the machine learning side for a team of five, building RDKit fingerprints and bioactivity models for colon-cancer compounds. First time a model of mine had to answer to chemistry and not just a loss curve.',
    kind: 'research',
  },
  {
    year: '2025',
    title: 'Prodigal AI, then Product Manager Accelerator',
    body:
      'Summer at Prodigal AI in Delhi on Docker, RAG, OCR and Airflow. From September, backend and ML for StylePilot at Product Manager Accelerator in the USA, remote. The team placed 2nd at the showcase.',
    kind: 'work',
  },
  {
    year: '2025 to 2026',
    title: 'The simulation years: SkyScout, the swarm sim, two papers',
    body:
      'A Mars scout drone with its own CAD, estimator and planner. A drone-swarm threat simulator where a GAN tries to hide attacks. Two papers, both of which report a result that is less exciting than the one I went looking for.',
    kind: 'build',
  },
  {
    year: 'May 2026',
    title: 'B.Tech awarded',
    body: 'Artificial Intelligence and Data Science, GGSIPU Delhi. Provisional certificate in hand.',
    kind: 'study',
  },
  {
    year: '2027',
    title: 'M.Sc. abroad',
    body:
      'Computational Science, Scientific Computing, CS or Robotics. Germany, Netherlands, Norway, USA. German is at A2 target for the Germany route.',
    kind: 'plan',
  },
];
