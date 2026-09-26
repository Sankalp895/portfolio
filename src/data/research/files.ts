/**
 * Result artefacts, with the sizes they actually are on disk.
 * Paths are relative to the results folder for each paper.
 */

export type Artefact = { path: string; desc: string; size: string };

export const grokkingFiles: Artefact[] = [
  {
    "path": "logs/lead_times.csv",
    "desc": "Lead time per seed per signal, the table the headline numbers come from",
    "size": "2 KB"
  },
  {
    "path": "logs/lead_times_summary.csv",
    "desc": "Lead times aggregated over the eight addition seeds",
    "size": "344 B"
  },
  {
    "path": "logs/lead_times_sub_summary.csv",
    "desc": "The same, for the five subtraction seeds",
    "size": "357 B"
  },
  {
    "path": "logs/predictor_seed0.csv",
    "desc": "Per-step accuracy and every tracked signal, one file per seed",
    "size": "21 KB"
  },
  {
    "path": "logs/predictor_seed0.json",
    "desc": "Run configuration and summary, including the firing rule",
    "size": "2 KB"
  },
  {
    "path": "logs/single.csv",
    "desc": "The 40,000 step run behind the headline curve",
    "size": "24 KB"
  },
  {
    "path": "logs/sweep.csv",
    "desc": "Weight decay and training fraction sweep behind the phase diagram",
    "size": "1 KB"
  },
  {
    "path": "logs/mechanism_fourier.npz",
    "desc": "Embedding spectra before and after the jump",
    "size": "44 KB"
  },
  {
    "path": "logs/pipeline.log",
    "desc": "Full run log",
    "size": "97 KB"
  }
];

export const surrogateFiles: Artefact[] = [
  {
    "path": "tables/primary_h4.csv",
    "desc": "The preregistered confirmatory test: margin against the null, with intervals",
    "size": "883 B"
  },
  {
    "path": "tables/h4_unsupervised_reported.csv",
    "desc": "The same comparison for the unsupervised family, reported not confirmatory",
    "size": "657 B"
  },
  {
    "path": "tables/indicator_summary.csv",
    "desc": "Spearman, Pearson and inversion rate per cell and indicator, with bootstrap intervals",
    "size": "434 KB"
  },
  {
    "path": "tables/solver_verification.csv",
    "desc": "Observed convergence order per solver against the expected order",
    "size": "274 B"
  },
  {
    "path": "tables/trainability.csv",
    "desc": "Validation error against a no-change baseline, per architecture and seed",
    "size": "4 KB"
  },
  {
    "path": "tables/null_member_disagreement.csv",
    "desc": "Spread between null model members",
    "size": "669 B"
  },
  {
    "path": "indicator_scores.csv",
    "desc": "Every indicator score for every evaluation sample",
    "size": "60.8 MB"
  },
  {
    "path": "run_manifest.json",
    "desc": "Cell list, test size and code fingerprint",
    "size": "3 KB"
  },
  {
    "path": "environment.txt",
    "desc": "Pinned package versions the grid ran under",
    "size": "963 B"
  },
  {
    "path": "tables/PROVENANCE.md",
    "desc": "How each table was produced",
    "size": "1 KB"
  }
];
