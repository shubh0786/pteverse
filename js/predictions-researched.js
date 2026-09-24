/**
 * Publicly researched prediction samples.
 *
 * These are practice examples from publicly accessible preparation material,
 * not confirmed Pearson exam questions. The source date reflects the public
 * page's sitemap update where available.
 */
window.PTE = window.PTE || {};
PTE.Predictions = PTE.Predictions || {};
PTE.ResearchedPredictionSources = [
  {
    name: 'PTE Magic — Speaking practice',
    url: 'https://ptemagic.com/pte-speaking-practice',
    updatedAt: '2026-09-02',
    note: 'Public task overview and item counts.'
  },
  {
    name: 'PTE Magic — Repeat Sentence practice',
    url: 'https://ptemagic.com/pte-repeat-sentence-practice-tips',
    updatedAt: '2026-09-02',
    note: 'Public sample sentences.'
  },
  {
    name: 'PTE Magic — Describe Image practice',
    url: 'https://ptemagic.com/pte-describe-image-practice-tips-templates-examples',
    updatedAt: '2026-09-02',
    note: 'Public response templates and examples.'
  },
  {
    name: 'PTE Magic — Re-tell Lecture',
    url: 'https://ptemagic.com/pte-retell-lecture',
    updatedAt: '2026-09-02',
    note: 'Public task timing and format guidance; no full lecture transcript was copied.'
  }
];

PTE.ResearchedPredictionFindings = {
  taskGuidance: [
    { task: 'Read Aloud', finding: 'Public overview lists approximately 6–7 items.', source: 'PTE Magic — Speaking practice' },
    { task: 'Repeat Sentence', finding: 'Public overview lists approximately 10–12 items.', source: 'PTE Magic — Speaking practice' },
    { task: 'Describe Image', finding: 'Public overview lists approximately 3–4 items.', source: 'PTE Magic — Speaking practice' },
    { task: 'Re-tell Lecture', finding: 'Public guidance describes 3–4 audio lectures, around 30–90 seconds each, with 10 seconds to prepare and 40 seconds to speak.', source: 'PTE Magic — Re-tell Lecture' },
    { task: 'Answer Short Question', finding: 'Public overview lists approximately 5–6 items.', source: 'PTE Magic — Speaking practice' }
  ],
  describeImageTemplates: [
    'The given [bar graph / line graph / pie chart / table / map / picture] illustrates information about [title or axis label].',
    'According to the [image], the highest value is recorded by [item] at approximately [number or unit].',
    'Overall, the [image] indicates that [one-sentence summary].'
  ],
  caveats: [
    'These public pages are preparation resources, not official Pearson prediction releases.',
    'The visible article dates are from 2023, while the public sitemap shows a September 2, 2026 update; this may indicate a page refresh or re-indexing rather than newly published exam content.',
    'Public exam-report communities were not reliably accessible during collection, so no private, login-protected, or paywalled material was included.',
    'Prediction questions are not guaranteed to appear on an exam.'
  ]
};

PTE.Predictions['repeat-sentence'] = PTE.Predictions['repeat-sentence'] || [];
PTE.Predictions['repeat-sentence'].push(
  {
    id: 'researched-rs-1',
    source: 'PTE Magic (public sample)',
    sourceUrl: 'https://ptemagic.com/pte-repeat-sentence-practice-tips',
    publishedAt: '2026-09-02',
    frequency: 'research-sample',
    text: 'The seminar has been moved to the lecture theatre on level three.',
    keywords: ['seminar', 'moved', 'lecture', 'theatre', 'level', 'three']
  },
  {
    id: 'researched-rs-2',
    source: 'PTE Magic (public sample)',
    sourceUrl: 'https://ptemagic.com/pte-repeat-sentence-practice-tips',
    publishedAt: '2026-09-02',
    frequency: 'research-sample',
    text: 'Assignments submitted after midnight will lose ten per cent of the marks.',
    keywords: ['assignments', 'submitted', 'midnight', 'lose', 'ten', 'per', 'cent', 'marks']
  },
  {
    id: 'researched-rs-3',
    source: 'PTE Magic (public sample)',
    sourceUrl: 'https://ptemagic.com/pte-repeat-sentence-practice-tips',
    publishedAt: '2026-09-02',
    frequency: 'research-sample',
    text: 'The lecturer explained that the distinction between correlation and causation is frequently overlooked in undergraduate dissertations.',
    keywords: ['lecturer', 'explained', 'distinction', 'correlation', 'causation', 'frequently', 'overlooked', 'undergraduate', 'dissertations']
  }
);

PTE.Predictions['describe-image'] = PTE.Predictions['describe-image'] || [];
PTE.Predictions['describe-image'].push(
  {
    id: 'researched-di-1',
    source: 'PTE Magic (public template)',
    sourceUrl: 'https://ptemagic.com/pte-describe-image-practice-tips-templates-examples',
    publishedAt: '2026-09-02',
    frequency: 'research-sample',
    chartType: 'bar',
    title: 'Public sample: describe the given bar graph',
    data: [
      {label: 'Category A', value: 72, color: '#6366f1'},
      {label: 'Category B', value: 54, color: '#10b981'},
      {label: 'Category C', value: 38, color: '#f59e0b'},
      {label: 'Category D', value: 21, color: '#ec4899'}
    ],
    keywords: ['bar graph', 'highest', 'lowest', 'value', 'comparison', 'overall']
  },
  {
    id: 'researched-di-2',
    source: 'PTE Magic (public template)',
    sourceUrl: 'https://ptemagic.com/pte-describe-image-practice-tips-templates-examples',
    publishedAt: '2026-09-02',
    frequency: 'research-sample',
    chartType: 'line',
    title: 'Public sample: describe the given line graph',
    data: [
      {label: '2019', value: 32},
      {label: '2020', value: 41},
      {label: '2021', value: 47},
      {label: '2022', value: 59},
      {label: '2023', value: 68}
    ],
    keywords: ['line graph', 'trend', 'increase', 'decrease', 'highest', 'overall']
  },
  {
    id: 'researched-di-3',
    source: 'PTE Magic (public template)',
    sourceUrl: 'https://ptemagic.com/pte-describe-image-practice-tips-templates-examples',
    publishedAt: '2026-09-02',
    frequency: 'research-sample',
    chartType: 'pie',
    title: 'Public sample: describe the given pie chart',
    data: [
      {label: 'Group A', value: 42, color: '#6366f1'},
      {label: 'Group B', value: 27, color: '#10b981'},
      {label: 'Group C', value: 19, color: '#f59e0b'},
      {label: 'Group D', value: 12, color: '#ec4899'}
    ],
    keywords: ['pie chart', 'proportion', 'percentage', 'largest', 'smallest', 'overall']
  }
);
