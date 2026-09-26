// The /now page. Dated, updated monthly. Section 3 of the brief.

export const now = {
  updated: '2026-09-19',
  place: 'Delhi, IN',
  headline: 'Applying for a 2027 M.Sc., and auditing my own results while I wait.',
  items: [
    {
      label: 'Applications',
      body:
        'Writing the M.Sc. applications for 2027: Computational Science, Scientific Computing, CS and Robotics, across Germany, the Netherlands, Norway and the USA. This site exists so a committee can check my work instead of taking my word for it.',
    },
    {
      label: 'Papers',
      body:
        'Two preprints are out: A Lead Time Is Not a Detection, on early-warning signals for grokking, and Surrogate Trust Audit, on whether you can tell when a neural PDE surrogate is wrong. The audit code and its full trail are public.',
    },
    {
      label: 'German',
      body: 'Working towards A2, for the German university route.',
    },
    {
      label: 'Cybersecurity',
      body: 'Going through the TryHackMe track. It is the same habit as the rest of this site: assume the happy path is lying to you.',
    },
    {
      label: 'LLM systems engineering',
      body: 'Evals, caching and serving. The part of LLM work that looks like engineering rather than prompting.',
    },
  ],
} as const;
