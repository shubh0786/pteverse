/**
 * PTEverse Command Center
 * One entry point for the complete preparation toolkit.
 */
window.PTE = window.PTE || {};

PTE.CommandCenter = {
  renderPage() {
    const groups = [
      {
        title: 'Diagnose & plan',
        color: 'cyan',
        items: [
          ['📊', 'Progress & analytics', 'Score trends, heatmap, weakest areas, badges', '#/progress'],
          ['📋', 'Adaptive study planner', 'Exam countdown, target score, and daily tasks', '#/planner'],
          ['🎯', 'Target score', 'Set your goal and track the gap to readiness', '#/target'],
          ['🧠', 'Smart practice', 'Practice questions selected from your history', '#/smart-practice']
        ]
      },
      {
        title: 'Practice every skill',
        color: 'violet',
        items: [
          ['🎙️', 'Speaking Skills Coach', 'Timing map, frameworks, drills, and feedback routes', '#/skills-coach'],
          ['🗣️', 'Fluency Lab', 'Shadowing, timed reading, linking, pace, and streaks', '#/fluency'],
          ['📝', 'Templates library', 'Response structures for every speaking task', '#/templates'],
          ['🎙️', 'Accent Coach', 'Pronunciation and clarity practice', '#/accent'],
          ['🧩', 'Pronunciation drills', 'Focused sound and word drills', '#/drills'],
          ['🃏', 'Vocabulary builder', 'Vocabulary practice and recall', '#/vocab']
        ]
      },
      {
        title: 'Exam readiness',
        color: 'amber',
        items: [
          ['🧪', 'Full mock test', 'Realistic timed speaking simulation', '#/mock-test'],
          ['⏱️', 'Pressure training', 'Practice under stricter time conditions', '#/pressure'],
          ['⚡', 'Daily challenge', 'A focused daily practice session', '#/daily'],
          ['🔮', 'Score predictor', 'Estimate readiness from completed work', '#/score-predictor'],
          ['🧠', 'Spaced review', 'Return to questions that need reinforcement', '#/review'],
          ['📓', 'Mistake notebook', 'Keep and revisit recurring errors', '#/notebook']
        ]
      },
      {
        title: 'Reading, writing & listening',
        color: 'emerald',
        items: [
          ['✍️', 'Writing', 'Practice all writing task types', '#/writing'],
          ['📖', 'Reading', 'Practice all reading task types', '#/reading'],
          ['🎧', 'Listening', 'Practice all listening task types', '#/listening'],
          ['🔍', 'Weak-word drill', 'Target words that repeatedly cause errors', '#/weak-words'],
          ['🏆', 'Leaderboard', 'Track challenges and achievements', '#/leaderboard'],
          ['🔔', 'Reminders', 'Set a consistent study routine', '#/reminders']
        ]
      }
    ];

    return `${PTE.UI.navbar('command-center')}
    <main class="min-h-screen py-8 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div>
            <div class="inline-flex rounded-full bg-cyan-500/5 border border-cyan-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-semibold">Complete preparation system</div>
            <h1 class="text-2xl md:text-3xl font-semibold text-zinc-100 mt-3">PTEverse Command Center</h1>
            <p class="text-sm text-zinc-500 mt-2 max-w-2xl">Everything in one place: diagnose your gaps, practise every skill, simulate exam conditions, and review progress.</p>
          </div>
          <div class="flex gap-2">
            <a href="#/skills-coach" class="btn-primary px-4 py-2.5 text-xs">Open Skills Coach</a>
            <a href="#/mock-test" class="btn-secondary px-4 py-2.5 text-xs">Start Mock Test</a>
          </div>
        </div>
        <div class="card-elevated rounded-2xl p-5 mb-8 border-cyan-500/10">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div><p class="text-[10px] uppercase tracking-[0.16em] text-cyan-300 font-semibold">Recommended flow</p><h2 class="text-lg font-semibold text-zinc-100 mt-1">Diagnose → Practise → Simulate → Review</h2><p class="text-xs text-zinc-500 mt-1">Use the tools below in order for a complete study cycle.</p></div>
            <div class="grid grid-cols-4 gap-2 text-center">${['Diagnose','Practise','Simulate','Review'].map((x, i) => `<div class="rounded-xl border border-[var(--border)] bg-white/[0.02] px-3 py-2"><span class="block text-[10px] font-mono text-cyan-300">0${i + 1}</span><span class="block text-[10px] text-zinc-400 mt-1">${x}</span></div>`).join('')}</div>
          </div>
        </div>
        <div class="space-y-8">${groups.map(group => `<section><div class="flex items-center justify-between mb-3"><h2 class="text-sm font-semibold text-zinc-200">${group.title}</h2><span class="text-[10px] uppercase tracking-[0.12em] text-${group.color}-300">${group.items.length} tools</span></div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${group.items.map(([icon, title, description, href]) => `<a href="${href}" class="card card-hover rounded-xl p-4 block"><div class="flex items-start gap-3"><span class="text-2xl">${icon}</span><span class="min-w-0"><strong class="block text-sm text-zinc-100">${title}</strong><span class="block text-xs leading-5 text-zinc-500 mt-1">${description}</span><span class="block text-[10px] text-${group.color}-300 mt-3">Open tool →</span></span></div></a>`).join('')}</div></section>`).join('')}</div>
        <p class="text-[10px] text-zinc-600 mt-8">AI and browser-generated scores are practice estimates, not official Pearson scores. Use official Pearson materials for final exam preparation.</p>
      </div>
    </main>`;
  }
};
