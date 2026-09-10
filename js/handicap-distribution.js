/* =========================================================================
   Golf Handicap Distribution
   Single source of truth for every handicap percentile shown on this site.

   SOURCE: USGA, "U.S. Handicapping Statistics"
   https://www.usga.org/handicapping/world-handicap-system/whs-stats.html
   Distribution and averages as of year-end 2025. The USGA publishes this as
   charts on that page; the figures below are transcribed from them.

   Population: 3.68M golfers with a Handicap Index (3.03M male, 0.65M female).
   Average Handicap Index: 14.0 male, 28.8 female.

   Deliberately NOT modelled:
     - Per age band distributions. Only per age band AVERAGES are published, so
       age is used for an average comparison and never for an age percentile.
     - A UK curve. England Golf publishes its own distribution and its averages
       run several strokes higher than the USGA's, so the two must never be
       blended. UK figures would need their own cohort, not a shifted US curve.

   The percentile function interpolates linearly between band boundaries, so
   any figure it returns is an interpolation of published band data. Present it
   as such: round to whole percent and say "roughly".
   ========================================================================= */
(function (root) {
  'use strict';

  /* Cumulative percentage of golfers at or below each band ceiling.
     Derived by running total from the USGA band shares below. */
  var anchorsMen = [
    [0, 2.01], [5, 10.24], [10, 29.81], [15, 56.29], [20, 78.49], [25, 90.92],
    [30, 96.51], [35, 98.69], [40, 99.48], [45, 99.76], [50, 99.87], [54, 100]
  ];
  var anchorsWomen = [
    [0, 0.85], [5, 2.35], [10, 4.89], [15, 10.13], [20, 20.40], [25, 36.24],
    [30, 55.30], [35, 72.01], [40, 83.93], [45, 91.17], [50, 95.32], [54, 100]
  ];

  /* The published bands, used verbatim for the citable table. */
  var bands = {
    men: [
      { label: 'Below 0.0', share: 2.01, cumulative: 2.01 },
      { label: '0.0 to 4.9', share: 8.23, cumulative: 10.24 },
      { label: '5.0 to 9.9', share: 19.57, cumulative: 29.81 },
      { label: '10.0 to 14.9', share: 26.48, cumulative: 56.29 },
      { label: '15.0 to 19.9', share: 22.20, cumulative: 78.49 },
      { label: '20.0 to 24.9', share: 12.43, cumulative: 90.92 },
      { label: '25.0 to 29.9', share: 5.59, cumulative: 96.51 },
      { label: '30.0 to 34.9', share: 2.18, cumulative: 98.69 },
      { label: '35.0 to 39.9', share: 0.79, cumulative: 99.48 },
      { label: '40.0 to 44.9', share: 0.28, cumulative: 99.76 },
      { label: '45.0 to 49.9', share: 0.11, cumulative: 99.87 },
      { label: '50.0 to 54.0', share: 0.13, cumulative: 100 }
    ],
    women: [
      { label: 'Below 0.0', share: 0.85, cumulative: 0.85 },
      { label: '0.0 to 4.9', share: 1.50, cumulative: 2.35 },
      { label: '5.0 to 9.9', share: 2.54, cumulative: 4.89 },
      { label: '10.0 to 14.9', share: 5.24, cumulative: 10.13 },
      { label: '15.0 to 19.9', share: 10.27, cumulative: 20.40 },
      { label: '20.0 to 24.9', share: 15.84, cumulative: 36.24 },
      { label: '25.0 to 29.9', share: 19.06, cumulative: 55.30 },
      { label: '30.0 to 34.9', share: 16.71, cumulative: 72.01 },
      { label: '35.0 to 39.9', share: 11.92, cumulative: 83.93 },
      { label: '40.0 to 44.9', share: 7.24, cumulative: 91.17 },
      { label: '45.0 to 49.9', share: 4.15, cumulative: 95.32 },
      { label: '50.0 to 54.0', share: 4.67, cumulative: 100 }
    ]
  };

  /* Average Handicap Index by age group. These are midpoints of ranges the
     site publishes, not USGA age band data, so they carry a lighter claim:
     they drive a comparison line, never a percentile. */
  var ageAvg = {
    men: { 'U18': 19, '20-29': 14, '30-39': 13, '40-49': 14, '50-59': 15, '60-69': 17, '70+': 22 },
    women: { 'U18': 32, '20-29': 24, '30-39': 24, '40-49': 26, '50-59': 27, '60-69': 28, '70+': 31 }
  };

  var ageLabels = {
    'U18': 'under 18', '20-29': '20 to 29', '30-39': '30 to 39', '40-49': '40 to 49',
    '50-59': '50 to 59', '60-69': '60 to 69', '70+': '70 and over'
  };

  var OVERALL_AVG = { men: 14.0, women: 28.8 };
  var PLAYERS = { men: '3.03 million', women: '0.65 million', total: '3.68 million' };
  var MAX_INDEX = 54.0;

  function interp(anchors, h) {
    if (h <= anchors[0][0]) return anchors[0][1];
    for (var i = 1; i < anchors.length; i++) {
      if (h <= anchors[i][0]) {
        var a = anchors[i - 1], b = anchors[i];
        return a[1] + (b[1] - a[1]) * ((h - a[0]) / (b[0] - a[0]));
      }
    }
    return 100;
  }

  /* Share of golfers playing off a HIGHER (worse) index, plus the share at or
     below. "higher" is the number a golfer actually wants to see. */
  function percentile(gender, index) {
    var anchors = gender === 'women' ? anchorsWomen : anchorsMen;
    var atOrBelow = interp(anchors, index);
    return {
      atOrBelow: Math.round(atOrBelow),
      higher: Math.max(1, Math.min(99, Math.round(100 - atOrBelow)))
    };
  }

  /* Plain band description. No em dashes: the site style guide forbids them. */
  function bracket(gender, h) {
    if (gender === 'women') {
      if (h < 5) return 'Elite: the top 2 percent of women';
      if (h < 10) return 'Very low: the top 5 percent of women';
      if (h < 15) return 'Low handicap: the top 10 percent of women';
      if (h < 20) return 'Better than 4 in 5 women';
      if (h < 29) return 'Better than the female average of 28.8';
      if (h < 35) return 'Mid handicap, around the largest single band';
      return 'High handicap, where the fastest gains are available';
    }
    if (h < 5) return 'Elite: the top 10 percent of men';
    if (h < 10) return 'Single figures: the top 30 percent of men';
    if (h < 14) return 'Better than the male average of 14.0';
    if (h < 20) return 'Mid handicap, the largest single band';
    if (h < 25) return 'Improving, with room to gain';
    return 'High handicap, where the fastest gains are available';
  }

  /* Distance to the average for a golfer's own age group. */
  function ageComparison(gender, index, ageKey) {
    if (!ageKey || !ageAvg[gender] || ageAvg[gender][ageKey] == null) return null;
    var avg = ageAvg[gender][ageKey];
    var diff = Math.round((index - avg) * 10) / 10;
    return {
      avg: avg,
      diff: diff,
      ageLabel: ageLabels[ageKey],
      noun: gender === 'women' ? 'woman' : 'man'
    };
  }

  root.SZ_HCP = {
    anchorsMen: anchorsMen,
    anchorsWomen: anchorsWomen,
    bands: bands,
    ageAvg: ageAvg,
    ageLabels: ageLabels,
    OVERALL_AVG: OVERALL_AVG,
    PLAYERS: PLAYERS,
    MAX_INDEX: MAX_INDEX,
    interp: interp,
    percentile: percentile,
    bracket: bracket,
    ageComparison: ageComparison,
    COHORT_NOTE: 'Interpolated between published bands, so treat it as approximate.',
    SOURCE_NAME: 'USGA, U.S. Handicapping Statistics',
    SOURCE_URL: 'https://www.usga.org/handicapping/world-handicap-system/whs-stats.html',
    SOURCE_ASOF: 'year-end 2025',
    REVIEWED: '2026-09-10'
  };
})(window);
