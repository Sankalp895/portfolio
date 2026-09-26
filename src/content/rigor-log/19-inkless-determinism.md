---
title: 'A test that forbids reading the clock'
order: 14
project: inkless
projectSlug: inkless
source: 'test_inkless.py'
severity: loud
firstMetric: 'The output was correct and the test suite passed, so the build looked reproducible.'
secondMetric: 'One call to the clock anywhere in the engine would make every build different, and no ordinary test would catch it because nothing else would change. A test parses the engine source into a syntax tree and asserts that time, datetime, calendar, random and uuid are never imported.'
fix: 'Keep the syntax-tree test in the suite, and pass the date in through a flag so the program never asks what today is.'
lesson: 'Reproducibility is a property you enforce, not one you claim. A rebuild in an empty virtualenv is byte-identical by SHA-256 because the engine has no way to be otherwise.'
---
