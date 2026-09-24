/**
 * PTEverse Speaking Skills Coach
 * A single launchpad for timing, frameworks, drills, simulation, and feedback.
 */
window.PTE = window.PTE || {};

PTE.SkillsCoach = {
  TASKS: [
    {id:'read-aloud', label:'Read Aloud', icon:'📖', prep:'35s', speak:'40s', focus:'Pronunciation · Fluency · Word accuracy', link:'#/practice/read-aloud'},
    {id:'repeat-sentence', label:'Repeat Sentence', icon:'🔁', prep:'0s', speak:'15s', focus:'Listening memory · Fluency', link:'#/practice/repeat-sentence'},
    {id:'describe-image', label:'Describe Image', icon:'📊', prep:'25s', speak:'40s', focus:'Content · Comparisons · Fluency', link:'#/practice/describe-image'},
    {id:'retell-lecture', label:'Re-tell Lecture', icon:'🎓', prep:'10s', speak:'40s', focus:'Note-taking · Content · Organization', link:'#/practice/retell-lecture'},
    {id:'answer-short-question', label:'Answer Short Question', icon:'❓', prep:'0s', speak:'10s', focus:'Vocabulary · Response speed', link:'#/practice/answer-short-question'},
    {id:'summarize-group-discussion', label:'Summarize Group Discussion', icon:'👥', prep:'10s', speak:'120s', focus:'Synthesis · Attribution · Fluency', link:'#/practice/summarize-group-discussion'},
    {id:'respond-to-situation', label:'Respond to a Situation', icon:'💬', prep:'10s', speak:'40s', focus:'Appropriacy · Tone · Fluency', link:'#/practice/respond-to-situation'}
  ],

  renderPage() {
    const stats = PTE.Store ? PTE.Store.getStats() : {};
    const overall = stats.overall || {};
    const sessions = PTE.Store ? (PTE.Store.getAll().sessions || []) : [];
    const speakingSessions = sessions.filter(s => this.TASKS.some(t => t.id === s.type));
    const average = speakingSessions.length
      ? Math.round(speakingSessions.reduce((sum, s) => sum + Number(s.overallScore || 0), 0) / speakingSessions.length)
      : 0;
    const taskCards = this.TASKS.map(task => {
      const type = PTE.QUESTION_TYPES && Object.values(PTE.QUESTION_TYPES).find(t => t.id === task.id);
      const taskStats = stats[task.id];
      return `<a href="${task.link}" class="card card-hover rounded-xl p-4 block">
        <div class="flex items-start gap-3">
          <span class="text-2xl">${task.icon}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-2"><strong class="text-sm text-zinc-100">${task.label}</strong><span class="text-[10px] font-mono text-cyan-300">${task.prep} + ${task.speak}</span></span>
            <span class="block text-xs text-zinc-500 mt-1">${task.focus}</span>
            <span class="block text-[10px] text-zinc-600 mt-2">${taskStats ? `${taskStats.totalAttempts} attempts · avg ${taskStats.averageScore}/90` : `${type ? type.examItems : 'Practice'} · start drill →`}</span>
          </span>
        </div>
      </a>`;
    }).join('');

    const frameworkCards = [
      ['📊', 'Describe Image', 'Chart type → topic → highest/lowest → comparison → overall', '#/templates'],
      ['🎓', 'Re-tell Lecture', 'Topic → main idea → two details → conclusion', '#/templates'],
      ['👥', 'Group Discussion', 'Attribute speakers → compare views → synthesize', '#/templates'],
      ['💬', 'Situation Response', 'Acknowledge → explain → propose → expected result', '#/templates']
    ].map(([icon, title, text, href]) => `<a href="${href}" class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4 hover:border-cyan-500/25 transition-colors"><span class="text-xl">${icon}</span><strong class="block text-sm text-zinc-200 mt-2">${title}</strong><span class="block text-xs text-zinc-500 mt-1">${text}</span></a>`).join('');

    return `${PTE.UI.navbar('skills-coach')}
    <main class="min-h-screen py-8 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div><div class="inline-flex rounded-full bg-cyan-500/5 border border-cyan-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-semibold">Speaking Skills Coach</div>
          <h1 class="text-2xl md:text-3xl font-semibold text-zinc-100 mt-3">Train the skill, not just the question.</h1>
          <p class="text-sm text-zinc-500 mt-2 max-w-2xl">Timed practice, response frameworks, exam structure, and feedback routes in one place.</p></div>
          <a href="#/mock-test" class="btn-primary px-4 py-2.5 text-xs">Start exam simulation →</a>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div class="card rounded-xl p-4"><p class="text-2xl font-mono font-semibold text-cyan-300">${speakingSessions.length}</p><p class="text-[10px] text-zinc-500 mt-1">Speaking attempts</p></div>
          <div class="card rounded-xl p-4"><p class="text-2xl font-mono font-semibold text-emerald-400">${average || overall.averageScore || 0}</p><p class="text-[10px] text-zinc-500 mt-1">Speaking average</p></div>
          <div class="card rounded-xl p-4"><p class="text-2xl font-mono font-semibold text-amber-300">${this.TASKS.length}</p><p class="text-[10px] text-zinc-500 mt-1">Task types</p></div>
          <div class="card rounded-xl p-4"><p class="text-2xl font-mono font-semibold text-violet-300">22</p><p class="text-[10px] text-zinc-500 mt-1">Full exam types</p></div>
        </div>

        <section class="mb-8"><div class="flex items-center justify-between mb-3"><h2 class="text-sm font-semibold text-zinc-200">Timed task map</h2><a href="#/practice" class="text-xs text-cyan-300">Open all practice →</a></div><div class="grid md:grid-cols-2 gap-3">${taskCards}</div></section>

        <section class="grid lg:grid-cols-2 gap-6 mb-8">
          <div class="card-elevated rounded-2xl p-5"><div class="flex items-center justify-between mb-4"><div><h2 class="text-sm font-semibold text-zinc-200">Response frameworks</h2><p class="text-xs text-zinc-500 mt-1">Use structure to protect content and fluency.</p></div><a href="#/templates" class="text-xs text-cyan-300">All templates →</a></div><div class="grid sm:grid-cols-2 gap-2">${frameworkCards}</div></div>
          <div class="card-elevated rounded-2xl p-5"><h2 class="text-sm font-semibold text-zinc-200">Skill drills</h2><p class="text-xs text-zinc-500 mt-1 mb-4">Target the trait that is holding your score back.</p><div class="space-y-2">
            <a href="#/fluency" class="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:border-cyan-500/25"><span class="text-xl">🗣️</span><span><strong class="block text-xs text-zinc-200">Fluency and pace</strong><span class="text-[10px] text-zinc-500">Shadowing, timed reading, linking, pace trainer</span></span></a>
            <a href="#/accent" class="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:border-cyan-500/25"><span class="text-xl">🎙️</span><span><strong class="block text-xs text-zinc-200">Pronunciation clarity</strong><span class="text-[10px] text-zinc-500">Accent and pronunciation analysis</span></span></a>
            <a href="#/smart-practice" class="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:border-cyan-500/25"><span class="text-xl">🧠</span><span><strong class="block text-xs text-zinc-200">Weak-area practice</strong><span class="text-[10px] text-zinc-500">Adaptive question selection from your history</span></span></a>
            <a href="#/progress" class="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 hover:border-cyan-500/25"><span class="text-xl">📈</span><span><strong class="block text-xs text-zinc-200">Trait feedback and trends</strong><span class="text-[10px] text-zinc-500">Review scores, weak areas, and recent improvement</span></span></a>
          </div></div>
        </section>

        <section class="card-elevated rounded-2xl p-5 mb-8"><div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 class="text-sm font-semibold text-zinc-200">Exam-day workflow</h2><p class="text-xs text-zinc-500 mt-1">Use this order for a realistic full speaking session.</p></div><a href="#/mock-test" class="text-xs text-amber-300">Open mock test →</a></div><div class="grid sm:grid-cols-4 gap-2 mt-4">${['Warm up · Fluency Lab','Review · Templates','Simulate · Mock Test','Analyze · Progress'].map((step, i) => `<div class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3"><span class="text-[10px] font-mono text-cyan-300">0${i + 1}</span><p class="text-xs text-zinc-300 mt-2">${step}</p></div>`).join('')}</div></section>
        <p class="text-[10px] text-zinc-600">Trait scores are estimates from browser speech/audio analysis and are not official Pearson scores.</p>
      </div>
    </main>`;
  }
};
