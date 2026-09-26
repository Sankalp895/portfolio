/**
 * Figures shown on the research pages.
 *
 * Every entry names the file it came from inside the results folders. The width
 * and height are the real pixel dimensions of the source PNG, so the browser can
 * reserve the space before the image arrives.
 *
 * Note on the folders: results(surrogat trust audit) is a byte-identical subset of
 * results(Grokking), so both papers' artefacts were read from the latter. The split
 * below is by subject, not by folder name.
 */

export type Figure = {
  name: string;
  alt: string;
  caption: string;
  source: string;
  w: number;
  h: number;
};

export const grokkingFigures: Record<string, Figure> = {
  curve: {
    name: 'grokking-curve',
    alt: 'Training and test accuracy and loss over 40,000 steps, showing test accuracy jumping long after train accuracy',
    caption:
      'The shape the whole paper is about. Train accuracy reaches 1.0 by about step 500, test accuracy sits at chance for thousands of steps, then jumps. Memorisation at 500, the test-accuracy crossing at 4,100.',
    source: 'figures/grokking_curve.png, from logs/single.csv',
    w: 3405,
    h: 1343,
  },
  leadTimes: {
    name: 'lead-times',
    alt: 'Lead time per signal across eight seeds for modular addition',
    caption:
      'Lead time for each candidate signal on modular addition, across eight seeds. A positive value is a warning that arrived before the test-accuracy jump.',
    source: 'figures/lead_times.png, from logs/lead_times.csv',
    w: 3255,
    h: 1626,
  },
  leadTimesSub: {
    name: 'lead-times-subtraction',
    alt: 'Lead time per signal across five seeds for modular subtraction',
    caption:
      'The same measurement repeated on modular subtraction across five seeds, as a check that the result was not specific to addition.',
    source: 'figures/lead_times_sub.png, from logs/lead_times_sub.csv',
    w: 3255,
    h: 1626,
  },
  signals: {
    name: 'predictor-signals',
    alt: 'Every tracked signal plotted over training for one run',
    caption:
      'Every tracked signal over one run: weight norm, embedding norm, effective embedding rank, and the three Fourier measures. The point of the paper is which of these cross a threshold before the jump and which do not.',
    source: 'figures/predictor_signals.png, from logs/predictor.csv',
    w: 3582,
    h: 4724,
  },
  spectrum: {
    name: 'fourier-spectrum',
    alt: 'Fourier spectrum of the embedding before and after grokking',
    caption:
      'The embedding spectrum before and after the jump. Energy concentrates into a few frequencies, which is what the Fourier signals are measuring.',
    source: 'figures/fourier_spectrum_beforeafter.png, from logs/mechanism_fourier.npz',
    w: 3255,
    h: 1319,
  },
  phase: {
    name: 'phase-diagram',
    alt: 'Phase diagram over weight decay and training fraction',
    caption:
      'Where grokking happens at all, across weight decay and the fraction of the data used for training. The sweep that fixed the setting used for the seed study.',
    source: 'figures/phase_diagram.png, from logs/sweep.csv',
    w: 2406,
    h: 1800,
  },
};

export const surrogateFigures: Record<string, Figure> = {
  nullComparison: {
    name: 'null-comparison',
    alt: 'Every trust indicator compared against the input-only null model',
    caption:
      'Each trust indicator against the input-only null model. The null never runs the surrogate, and still matches or beats every indicator tested.',
    source: 'figures/fig_g_null_comparison.png',
    w: 2070,
    h: 1290,
  },
  correlationVsShift: {
    name: 'correlation-vs-shift',
    alt: 'Correlation with true error as distribution shift increases',
    caption:
      'How well each indicator tracks true error as the inputs move further from what the surrogate was trained on. The confirmatory test is read at the most shifted end.',
    source: 'figures/fig_b_correlation_vs_shift.png',
    w: 1950,
    h: 750,
  },
  inDistribution: {
    name: 'in-distribution-correlation',
    alt: 'Correlation with true error on in-distribution inputs',
    caption:
      'The same measurement with no shift at all. Indicators look useful here, which is part of why the shifted case is the one worth testing.',
    source: 'figures/fig_a_in_distribution_correlation.png',
    w: 1950,
    h: 750,
  },
  inversion: {
    name: 'inversion-rate',
    alt: 'Inversion rate per indicator',
    caption:
      'Inversion rate: how often an indicator ranks a worse prediction as safer than a better one. A coin flip is 0.5.',
    source: 'figures/fig_c_inversion_rate.png',
    w: 1950,
    h: 750,
  },
  falseConfidence: {
    name: 'false-confidence',
    alt: 'False confidence rate per indicator',
    caption:
      'How often each indicator reports low risk while the surrogate is in fact badly wrong. This is the failure that matters in use.',
    source: 'figures/fig_d_false_confidence.png',
    w: 1950,
    h: 750,
  },
  predictionVsTruth: {
    name: 'prediction-vs-truth',
    alt: 'Surrogate prediction against the reference solution',
    caption:
      'A surrogate rollout against the reference solver on the same input, which is where the true error being measured comes from.',
    source: 'figures/manuscript/fig12_prediction_vs_truth.png',
    w: 1352,
    h: 966,
  },
  representability: {
    name: 'representability',
    alt: 'Representable and unrepresentable samples per regime',
    caption:
      'How much of each regime the surrogate can represent at all. In the most shifted regime a large part is outside what the model can express, which limits what any indicator could do.',
    source: 'figures/manuscript/fig3_representability.png',
    w: 820,
    h: 582,
  },
};
