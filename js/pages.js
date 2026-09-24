/**
 * PTE Speaking Module - Page Renderers (Redesigned)
 * Clean, minimal pages inspired by Linear/Vercel
 */

window.PTE = window.PTE || {};

PTE.Pages = {
  // ── Home Page ─────────────────────────────────────
  home() {
    const stats = PTE.Store.getStats();
    const overall = stats.overall || null;
    const gp = PTE.Gamify ? PTE.Gamify.getProgress() : null;
    const user = PTE.Auth ? PTE.Auth.getCurrentUser() : null;

    let statsSection = '';
    if (overall) {
      statsSection = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-10">
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-[var(--accent-light)]">${overall.totalAttempts}</p><p class="text-[10px] text-zinc-500 mt-1">Attempts</p></div>
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-green-400">${overall.averageScore}</p><p class="text-[10px] text-zinc-500 mt-1">Avg Score</p></div>
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-[var(--violet)]">${overall.bestScore}</p><p class="text-[10px] text-zinc-500 mt-1">Best</p></div>
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-amber-400">${overall.streak}</p><p class="text-[10px] text-zinc-500 mt-1">Day Streak</p></div>
      </div>`;
    }

    let profileCard = '';
    if (gp) {
      const badgeIcons = gp.badges.slice(0,6).map(b => `<span title="${b.name}" class="text-base cursor-default">${b.icon}</span>`).join('');
      profileCard = `
      <div class="max-w-4xl mx-auto mb-10 card-elevated rounded-xl p-5">
        <div class="flex flex-col sm:flex-row items-center gap-5">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6d5cff] to-[#a78bfa] flex items-center justify-center text-2xl shadow-lg">${gp.level.icon}</div>
          <div class="flex-1 text-center sm:text-left">
            <div class="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 class="text-base font-semibold text-zinc-100">${gp.level.title}</h3>
              <span class="badge badge-level">Lv ${gp.level.level}</span>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <div class="xp-bar-bg flex-1 max-w-[200px]"><div class="xp-bar-fill" style="width:${gp.progress}%"></div></div>
              <span class="text-[10px] text-[var(--accent-light)] font-mono font-medium">${gp.xp}/${gp.nextLevel.xpNeeded} XP</span>
            </div>
            <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              ${gp.streak > 0 ? `<span class="badge badge-streak">${gp.streak}d streak</span>` : ''}
              <span class="badge badge-xp">${gp.xp} XP</span>
              ${badgeIcons ? `<div class="flex gap-0.5 ml-1">${badgeIcons}</div>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    }

    let plannerSummary = '';
    if (PTE.Planner) {
      const planner = PTE.Planner.getData();
      if (planner) {
        const daysLeft = PTE.Planner.getDaysLeft();
        const todayPlan = PTE.Planner.getTodayPlan();
        const totalPending = todayPlan ? Object.values(todayPlan.plan).reduce((sum, item) => sum + Math.max(0, item.remaining), 0) : 0;
        const topPending = todayPlan ? Object.entries(todayPlan.plan)
          .sort((a, b) => b[1].remaining - a[1].remaining)
          .slice(0, 3)
          .map(([typeId, item]) => {
            const type = PTE.Planner._findType(typeId);
            return type ? `<div class="flex items-center justify-between py-1.5"><span class="text-zinc-300 text-sm">${type.name}</span><span class="text-[var(--accent-light)] font-mono text-xs">${item.remaining} left</span></div>` : '';
          })
          .join('') : '';
        const completion = todayPlan ? todayPlan.pct : 0;
        plannerSummary = `
          <section class="px-4 pb-6">
            <div class="max-w-5xl mx-auto card-elevated rounded-2xl p-5 md:p-6">
              <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-[var(--accent-light)] font-semibold">Exam dashboard</p>
                  <h2 class="text-xl font-semibold text-zinc-100 mt-1">${daysLeft === 0 ? 'Exam day is here' : `${daysLeft ?? 0} days left`}</h2>
                </div>
                <a href="#/planner" class="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white/[0.02] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-[rgba(109,92,255,0.35)] transition-all">Open planner</a>
              </div>

              <div class="mt-5 grid gap-3 md:grid-cols-3">
                <div class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                  <p class="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Target score</p>
                  <p class="mt-2 text-2xl font-semibold text-white font-mono">${planner.targetScore || 65}+</p>
                </div>
                <div class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                  <p class="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Today’s task</p>
                  <p class="mt-2 text-2xl font-semibold text-white font-mono">${totalPending}</p>
                </div>
                <div class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                  <p class="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Progress</p>
                  <p class="mt-2 text-2xl font-semibold text-[var(--accent-light)] font-mono">${completion}%</p>
                </div>
              </div>

              <div class="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold text-zinc-200">Pending today</h3>
                  <span class="text-[10px] uppercase tracking-[0.12em] text-zinc-500">${totalPending} remaining</span>
                </div>
                <div class="space-y-1">${topPending || `<p class="text-sm text-zinc-500">You’re all caught up for today.</p>`}</div>
              </div>
            </div>
          </section>`;
      } else {
        plannerSummary = `
          <section class="px-4 pb-6">
            <div class="max-w-5xl mx-auto card-elevated rounded-2xl p-5 md:p-6">
              <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="text-[10px] uppercase tracking-[0.18em] text-[var(--accent-light)] font-semibold">Exam dashboard</p>
                  <h2 class="text-xl font-semibold text-zinc-100 mt-1">Set your exam plan</h2>
                </div>
                <a href="#/planner" class="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-white/[0.02] px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-[rgba(109,92,255,0.35)] transition-all">Create plan</a>
              </div>
              <p class="mt-4 text-sm text-zinc-400">Add your target score and exam date to see your remaining days, today’s task list, and study progress.</p>
            </div>
          </section>`;
      }
    }

    let predictionSummary = '';
    if (PTE.Predictions) {
      const predictionTypes = Object.values(PTE.QUESTION_TYPES || {});
      const latestPredictions = [];
      predictionTypes.forEach((type) => {
        (PTE.Predictions[type.id] || []).forEach((question) => {
          if (!question.stale) latestPredictions.push({ type, question });
        });
      });
      latestPredictions.sort((a, b) => {
        const dateOrder = String(b.question.publishedAt || '').localeCompare(String(a.question.publishedAt || ''));
        if (dateOrder !== 0) return dateOrder;
        const researchedA = a.question.frequency === 'research-sample' ? 1 : 0;
        const researchedB = b.question.frequency === 'research-sample' ? 1 : 0;
        return researchedB - researchedA;
      });
      const totalCurrent = latestPredictions.length;
      const latestCards = latestPredictions.slice(0, 5).map(({ type, question }) => {
        const prompt = question.text || question.prompt || question.scenario || question.audioText || 'Prediction question';
        return `<a href="#/predictions/${type.id}" class="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 hover:border-amber-500/30 transition-colors">
          <span class="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm" style="background:${type.color}11">${type.icon}</span>
          <span class="min-w-0 flex-1"><span class="block text-[10px] uppercase tracking-[0.12em] text-amber-400">${type.shortName} · ${question.frequency || 'Current'}</span><span class="block truncate text-xs text-zinc-300">${prompt}</span></span>
          <span class="text-zinc-600">→</span>
        </a>`;
      }).join('');
      predictionSummary = `
        <section class="px-4 pb-6">
          <div class="max-w-5xl mx-auto card-elevated rounded-2xl p-5 md:p-6 border-amber-500/10">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-[10px] uppercase tracking-[0.18em] text-amber-400 font-semibold">Latest prediction set</p>
                <h2 class="text-xl font-semibold text-zinc-100 mt-1">${totalCurrent} current prediction questions</h2>
                <p class="text-xs text-zinc-500 mt-1">Unofficial, high-frequency practice based on the app’s dated prediction bank.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <a href="#/researched-predictions" class="inline-flex items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/[0.12] transition-all">Research set →</a>
                <a href="#/predictions" class="inline-flex items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/[0.12] transition-all">All predictions →</a>
              </div>
            </div>
            <div class="mt-4 grid gap-2">${latestCards || '<p class="text-sm text-zinc-500">No current predictions are available.</p>'}</div>
            <p class="mt-3 text-[10px] text-zinc-600">Predictions are not guaranteed exam questions. Always prepare across every task type.</p>
          </div>
        </section>`;
    }

    return `
    ${PTE.UI.navbar('home')}
    <main class="min-h-screen">
      <!-- Hero -->
      <section class="home-hero relative" data-parallax-layer="hero">
        <div class="home-hero-orb home-hero-orb-one" data-parallax-layer="orb"></div>
        <div class="home-hero-orb home-hero-orb-two" data-parallax-layer="orb"></div>
        <div class="max-w-5xl mx-auto px-4 py-14 md:py-24 text-center relative z-10">
          ${user ? `<p class="text-sm text-[var(--accent-light)] font-medium mb-3">Welcome back, ${user.username}</p>` : ''}
          <div class="hero-eyebrow"><span class="hero-eyebrow-dot"></span> Your intelligent PTE training space</div>
          <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-5 hero-title">
            Prepare with <span class="gradient-text">clarity.</span>
          </h1>
          <p class="text-sm md:text-lg text-zinc-400 mb-9 max-w-2xl mx-auto hero-copy">
            Practice every PTE Academic skill in one focused workspace, with realistic feedback that shows you what to do next.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#/mock-test" class="btn-primary px-7 py-3 hero-cta">Start a mock test <span aria-hidden="true">→</span></a>
            <a href="#/practice" class="btn-secondary px-7 py-3">Explore practice <span aria-hidden="true">↗</span></a>
          </div>
          <div class="hero-signal-row"><span>22 question types</span><i></i><span>AI-assisted feedback</span><i></i><span>Progress that compounds</span></div>
        </div>
      </section>

      ${profileCard ? `<section class="px-4">${profileCard}</section>` : ''}
      ${plannerSummary}
      ${predictionSummary}

      <!-- Onboarding -->
      ${(() => {
        if (!overall || overall.totalAttempts < 10) {
          const hasRA = stats['read-aloud'] && stats['read-aloud'].totalAttempts > 0;
          const hasMock = PTE.Store.getAll().sessions.some(s => s.type === 'mock-test');
          const hasMultiType = Object.values(PTE.QUESTION_TYPES).filter(t => stats[t.id] && stats[t.id].totalAttempts > 0).length >= 3;
          const score70 = overall && overall.bestScore >= 70;
          if (hasRA && hasMock && hasMultiType && score70) return '';
          const checkIcon = '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
          const arrow = '<svg class="w-3.5 h-3.5 text-zinc-700 group-hover:text-[var(--accent-light)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
          const item = (done, num, title, desc, href) => `
            <${href?'a href="'+href+'"':'div'} class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors group">
              <div class="onboarding-check ${done?'done':''}">
                ${done ? checkIcon : `<span class="text-[10px] text-zinc-600 font-mono">${num}</span>`}
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium ${done?'text-zinc-600 line-through':'text-zinc-200 group-hover:text-[var(--accent-light)]'} transition-colors">${title}</p>
                <p class="text-[11px] text-zinc-600">${desc}</p>
              </div>
              ${!done && href ? arrow : ''}
            </${href?'a':'div'}>`;
          return `
          <section class="px-4 pb-6">
            <div class="max-w-4xl mx-auto onboarding-card">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-zinc-200">Getting Started</h3>
                <button onclick="this.closest('section').remove()" class="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">Dismiss</button>
              </div>
              <div class="space-y-1">
                ${item(hasRA, 1, 'Complete your first Read Aloud', 'The most common PTE Speaking task', '#/practice/read-aloud')}
                ${item(hasMultiType, 2, 'Try 3 different question types', 'Explore the variety of tasks', '#/practice')}
                ${item(hasMock, 3, 'Take a Mock Test', 'Simulate the real exam', '#/mock-test')}
                ${item(score70, 4, 'Score 70+ on any question', 'Build your confidence', null)}
              </div>
            </div>
          </section>`;
        }
        return '';
      })()}

      <!-- Action Cards -->
      <section class="px-4 py-4">
        <div class="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${PTE.Daily ? PTE.Daily.renderCard() : ''}
          ${PTE.SmartPractice ? PTE.SmartPractice.renderCard() : ''}
          ${PTE.PressureTraining ? PTE.PressureTraining.renderCard() : ''}
          ${PTE.Fluency ? PTE.Fluency.renderCard() : ''}
          ${PTE.Planner ? PTE.Planner.renderCard() : ''}
          ${PTE.Spaced ? PTE.Spaced.renderCard() : ''}
        </div>
      </section>

      ${statsSection ? `<section class="py-4 px-4">${statsSection}</section>` : ''}

      <!-- All Modules -->
      <section class="py-12 px-4">
        <div class="max-w-5xl mx-auto">
          <div class="mb-8">
            <h2 class="text-xl font-semibold text-zinc-100 tracking-tight mb-1">PTE Academic Modules</h2>
            <p class="text-sm text-zinc-500">All 4 test sections with 22 question types.</p>
          </div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
            <a href="#/practice" class="module-card group">
              <div class="module-icon module-icon-speaking" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3M8 21h8"/></svg></div>
              <h3 class="font-semibold text-zinc-200 text-sm mb-1 group-hover:text-[var(--accent-light)] transition-colors">Speaking</h3>
              <p class="text-xs text-zinc-500 mb-2">7 question types including Read Aloud, Repeat Sentence, and more.</p>
              <span class="text-[10px] text-zinc-600">${Object.keys(PTE.QUESTION_TYPES).length} types · ${Object.values(PTE.Questions).reduce((s,a)=>s+a.length,0)}+ questions</span>
            </a>
            <a href="#/writing" class="module-card group">
              <div class="module-icon module-icon-writing" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m14 5 5 5M4 20l3.2-.7L19.3 7.2a2.1 2.1 0 0 0-3-3L4.2 16.3 4 20Z"/></svg></div>
              <h3 class="font-semibold text-zinc-200 text-sm mb-1 group-hover:text-[var(--accent-light)] transition-colors">Writing</h3>
              <p class="text-xs text-zinc-500 mb-2">Summarize Written Text and Write Essay with AI scoring.</p>
              <span class="text-[10px] text-zinc-600">${PTE.WRITING_TYPES ? Object.keys(PTE.WRITING_TYPES).length : 2} types</span>
            </a>
            <a href="#/reading" class="module-card group">
              <div class="module-icon module-icon-reading" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21V5.5Z"/></svg></div>
              <h3 class="font-semibold text-zinc-200 text-sm mb-1 group-hover:text-[var(--accent-light)] transition-colors">Reading</h3>
              <p class="text-xs text-zinc-500 mb-2">Fill in Blanks, Re-order Paragraphs, Multiple Choice, and more.</p>
              <span class="text-[10px] text-zinc-600">${PTE.READING_TYPES ? Object.keys(PTE.READING_TYPES).length : 5} types</span>
            </a>
            <a href="#/listening" class="module-card group">
              <div class="module-icon module-icon-listening" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13v4a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2ZM20 13v4a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z"/></svg></div>
              <h3 class="font-semibold text-zinc-200 text-sm mb-1 group-hover:text-[var(--accent-light)] transition-colors">Listening</h3>
              <p class="text-xs text-zinc-500 mb-2">Summarize Spoken Text, Write from Dictation, and 6 more types.</p>
              <span class="text-[10px] text-zinc-600">${PTE.LISTENING_TYPES ? Object.keys(PTE.LISTENING_TYPES).length : 8} types</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-[var(--border)] py-6 px-4 text-center">
        <p class="text-[10px] text-zinc-600">PTEverse &middot; Designed by Sanjay Singh And Sons Solutions &middot; Not affiliated with Pearson.</p>
      </footer>
    </main>`;
  },

  // ── Practice Selection ────────────────────────────
  practice() {
    return `
    ${PTE.UI.navbar('practice')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="mb-8">
          <h1 class="text-xl font-semibold text-zinc-100 tracking-tight mb-1">Choose a Question Type</h1>
          <p class="text-sm text-zinc-500">Pick any of the 7 speaking question types to practice, or jump to Writing, Reading, or Listening from the menu.</p>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
          ${Object.values(PTE.QUESTION_TYPES).map(t => PTE.UI.typeCard(t)).join('')}
        </div>
      </div>
    </main>`;
  },

  // ── Progress ──────────────────────────────────────
  progress() {
    const stats = PTE.Store.getStats();
    const overall = stats.overall;
    const recentSessions = PTE.Store.getRecentSessions(15);
    if (!overall || overall.totalAttempts === 0) {
      return `
      ${PTE.UI.navbar('progress')}
      <main class="min-h-screen py-10 px-4">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-xl font-semibold text-zinc-100 tracking-tight mb-6">Your Progress</h1>
          ${PTE.UI.emptyState('📊', 'No Sessions Yet', 'Start practicing to see your progress.', 'Start Practicing', '#/practice')}
        </div>
      </main>`;
    }

    let typeBreakdown = '';
    [PTE.QUESTION_TYPES, PTE.WRITING_TYPES, PTE.READING_TYPES, PTE.LISTENING_TYPES]
      .flatMap(m => m ? Object.values(m) : [])
      .forEach(type => {
      const typeStat = stats[type.id];
      if (typeStat) {
        typeBreakdown += `
        <div class="card rounded-lg p-3.5 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style="background:${type.color}11">${type.icon}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-sm font-medium text-zinc-300 truncate">${type.name}</h4>
              <span class="text-xs font-semibold font-mono text-[var(--accent-light)]">${typeStat.averageScore}/90</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div class="h-full rounded-full" style="width:${(typeStat.averageScore/90)*100}%;background:${type.color}"></div>
              </div>
              <span class="text-[10px] text-zinc-600 flex-shrink-0">${typeStat.totalAttempts} tries</span>
            </div>
          </div>
          <div class="flex-shrink-0">${PTE.UI.sparkline(typeStat.recentScores)}</div>
        </div>`;
      }
    });

    let recentTable = '';
    if (recentSessions.length > 0) {
      recentTable = `
      <div class="card-elevated rounded-xl overflow-hidden">
        <div class="px-5 py-3 border-b border-[var(--border)]"><h3 class="text-sm font-semibold text-zinc-200">Recent Sessions</h3></div>
        <div class="divide-y divide-[var(--border)]">
          ${recentSessions.map(s => {
            const typeConfig = this._findTypeConfig(s.type);
            const band = PTE.Scoring.getBand(s.overallScore);
            return `
            <div class="px-5 py-2.5 flex items-center gap-3 hover:bg-white/[0.01] transition-colors">
              <div class="w-7 h-7 rounded-md flex items-center justify-center text-sm" style="background:${typeConfig ? typeConfig.color + '11' : 'var(--surface-3)'}">${typeConfig ? typeConfig.icon : '?'}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-zinc-300 truncate">${typeConfig ? typeConfig.name : s.type}</p>
                <p class="text-[10px] text-zinc-600">${s.date}</p>
              </div>
              <span class="text-xs font-semibold font-mono" style="color:${band.color}">${s.overallScore}/90</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }

    const practiceMinutes = Math.round((overall.totalPracticeTime || 0) / 60);
    return `
    ${PTE.UI.navbar('progress')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-xl font-semibold text-zinc-100 tracking-tight">Your Progress</h1>
          <button onclick="if(confirm('Clear all data?')){PTE.Store.clearAll();PTE.Router.navigate(location.hash.slice(1));}" class="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">Clear Data</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 stagger">
          <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-[var(--accent-light)]">${overall.totalAttempts}</p><p class="text-[10px] text-zinc-500 mt-1">Attempts</p></div>
          <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-green-400">${overall.averageScore}</p><p class="text-[10px] text-zinc-500 mt-1">Average</p></div>
          <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-[var(--violet)]">${overall.bestScore}</p><p class="text-[10px] text-zinc-500 mt-1">Best</p></div>
          <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-amber-400">${practiceMinutes}<span class="text-sm">m</span></p><p class="text-[10px] text-zinc-500 mt-1">Practice</p></div>
        </div>
        <div class="mb-8">
          <h3 class="text-sm font-semibold text-zinc-200 mb-3">By Question Type</h3>
          <div class="space-y-2">${typeBreakdown || '<p class="text-zinc-600 text-sm">No data yet</p>'}</div>
        </div>
        ${recentTable}
      </div>
    </main>`;
  },

  // ── Mistake Notebook Page ────────────────────────────────────
  notebook() {
    const weakItems = PTE.Store.getMistakeQuestions(55, 80);

    if (!weakItems.length) {
      return `
      ${PTE.UI.navbar('notebook')}
      <main class="min-h-screen py-10 px-4">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-xl font-semibold text-zinc-100 tracking-tight mb-1">Mistake Notebook</h1>
          <p class="text-sm text-zinc-500 mb-8">Questions where your score dropped below 55/90 will appear here for focused revision.</p>
          ${PTE.UI.emptyState('📓', 'No Mistakes Yet', 'Great start. Keep practicing and your low-score questions will be collected here automatically.')}
          <div class="text-center mt-6">
            <a href="#/practice" class="btn-primary">Start Practice</a>
          </div>
        </div>
      </main>`;
    }

    const cards = weakItems.map(item => {
      const typeCfg = this._findTypeConfig(item.type);
      const band = PTE.Scoring.getBand(item.latestScore || 0);
      const q = this._findQuestionById(item.type, item.questionId);
      const prompt = this._questionPrompt(q);
      const transcript = (item.latestTranscript || '').trim();
      const transcriptPreview = transcript
        ? transcript.slice(0, 160) + (transcript.length > 160 ? '...' : '')
        : 'No transcript captured for this attempt.';

      return `
      <div class="card card-hover rounded-xl p-5">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style="background:${typeCfg ? typeCfg.color + '11' : 'var(--surface-2)'}">
              ${typeCfg ? typeCfg.icon : '❓'}
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-zinc-200 text-sm truncate">${typeCfg ? typeCfg.name : item.type}</h3>
              <p class="text-xs text-zinc-600">ID: ${item.questionId}</p>
            </div>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" style="background:${band.color}22;color:${band.color}">
            ${item.latestScore}/90
          </span>
        </div>

        <p class="text-sm text-zinc-400 leading-relaxed mb-3">${prompt}</p>

        <div class="bg-white/[0.02] border border-[var(--border)] rounded-lg p-3 mb-4">
          <p class="text-[10px] text-zinc-600 mb-1 uppercase tracking-wide">Last Transcript</p>
          <p class="text-xs text-zinc-500">${transcriptPreview}</p>
        </div>

        <div class="flex items-center justify-between text-[10px] text-zinc-600 mb-4">
          <span>Attempts: ${item.attempts}</span>
          <span>Best: ${item.bestScore}/90</span>
          <span>${item.latestDate || 'Recent'}</span>
        </div>

        <a href="#/retry/${item.type}/${encodeURIComponent(item.questionId)}" class="btn-primary inline-flex items-center gap-2 text-sm">
          Retry This Question
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </a>
      </div>`;
    }).join('');

    return `
    ${PTE.UI.navbar('notebook')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-xl font-semibold text-zinc-100 tracking-tight mb-1">Mistake Notebook</h1>
          <p class="text-sm text-zinc-500">Focused revision of weak questions (score under 55/90), sorted by lowest score first.</p>
        </div>
        <div class="space-y-4">${cards}</div>
      </div>
    </main>`;
  },

  _findTypeConfig(typeId) {
    return [PTE.QUESTION_TYPES, PTE.WRITING_TYPES, PTE.READING_TYPES, PTE.LISTENING_TYPES]
      .flatMap(m => m ? Object.values(m) : [])
      .find(t => t.id === typeId);
  },

  _findQuestionById(typeId, questionId) {
    const byId = q => q && q.id && String(q.id) === String(questionId);
    const banks = [PTE.Questions, PTE.WritingQuestions, PTE.ReadingQuestions, PTE.ListeningQuestions];
    for (const b of banks) {
      const arr = b && b[typeId] ? b[typeId] : [];
      const found = arr.find(byId);
      if (found) return found;
    }
    return (PTE.Predictions && PTE.Predictions[typeId] ? PTE.Predictions[typeId] : []).find(byId) || null;
  },

  _questionPrompt(question) {
    if (!question) return 'Question details unavailable. It may no longer exist in the current question bank.';
    const clip = (s, n = 220) => s.slice(0, n) + (s.length > n ? '...' : '');
    if (question.scenario) return clip(question.scenario);
    if (question.prompt) return clip(question.prompt);          // essay
    if (question.passage) return clip(question.passage);        // reading / swt
    if (question.question) return clip(question.question);      // MCQ stem
    if (question.text) return clip(question.text);
    if (question.audioText) return clip(question.audioText);
    if (question.displayText) return clip(question.displayText);// HIW
    if (question.transcript) return clip(question.transcript);  // L-FIB
    if (question.speakers && question.speakers.length) {
      const merged = question.speakers.map(s => s.text).join(' ');
      return clip(merged);
    }
    return 'Prompt not available for this item.';
  },

  // ── Practice Question Page ───────────────────────────────────
  practiceQuestion(typeId, predictionsOnly) {
    const typeConfig = Object.values(PTE.QUESTION_TYPES).find(t => t.id === typeId);
    const isPred = !!predictionsOnly;
    const navPage = isPred ? 'predictions' : 'practice';
    const backUrl = isPred ? '#/predictions' : '#/practice';
    if (!typeConfig) {
      return `${PTE.UI.navbar(navPage)}<main class="min-h-screen py-10 px-4"><div class="max-w-4xl mx-auto">${PTE.UI.emptyState('🔍', 'Not Found', 'Question type does not exist.', 'Back', backUrl)}</div></main>`;
    }
    const questions = isPred ? (PTE.Predictions[typeId] || []) : (PTE.Questions[typeId] || []);
    if (questions.length === 0) {
      return `${PTE.UI.navbar(navPage)}<main class="min-h-screen py-10 px-4"><div class="max-w-4xl mx-auto">${PTE.UI.emptyState('📝', 'No Questions', 'Questions coming soon.', 'Back', backUrl)}</div></main>`;
    }
    return `
    ${PTE.UI.navbar(navPage)}
    <main class="min-h-screen py-6 px-4">
      <div class="max-w-2xl mx-auto">
        ${isPred ? '<div class="mb-3"><span class="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-500/8 text-amber-400 border border-amber-500/10">Prediction Questions</span></div>' : ''}
        <div class="flex items-center gap-3 mb-5">
          <a href="${backUrl}" class="w-8 h-8 card rounded-lg flex items-center justify-center hover:bg-[var(--surface-3)] transition-colors">
            <svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-lg">${typeConfig.icon}</span>
              <h1 class="text-base font-semibold text-zinc-100">${typeConfig.name}</h1>
              <span class="text-[9px] font-semibold font-mono px-1.5 py-0.5 rounded" style="background:${typeConfig.color}11;color:${typeConfig.color}">${typeConfig.shortName}</span>
            </div>
            <p class="text-xs text-zinc-500">${typeConfig.description}</p>
          </div>
        </div>
        <details class="mb-5">
          <summary class="cursor-pointer text-xs font-medium text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 hover:bg-amber-500/8 transition-colors">Tips for ${typeConfig.name}</summary>
          <div class="mt-2">${PTE.UI.tipsPanel(typeConfig.tips)}</div>
        </details>
        ${(() => {
          const completionMap = PTE.Store.getCompletionMap(typeId);
          const completedCount = questions.filter(q => completionMap[q.id]).length;
          return `
          <div class="mb-5" id="question-nav-area">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-zinc-500">Question</span>
                <select id="question-select" class="input-dark text-xs !w-auto !py-1 !px-2 !min-h-0" onchange="PTE.App.loadQuestion(this.value)">
                  ${questions.map((q, i) => {
                    const done = completionMap[q.id];
                    return `<option value="${i}">${done ? '\u2713 ' : ''}Q${i + 1}${done ? ' — ' + done.bestScore + '/90' : ''}</option>`;
                  }).join('')}
                </select>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-zinc-600 font-mono">${completedCount}/${questions.length}</span>
                <button id="btn-skip" onclick="PTE.App.nextQuestion()" class="text-xs text-zinc-500 hover:text-[var(--accent-light)] font-medium transition-colors">Skip →</button>
              </div>
            </div>
            <div class="flex gap-0.5 flex-wrap">
              ${questions.map((q, i) => {
                const done = completionMap[q.id];
                if (done) {
                  const c = done.bestScore >= 65 ? 'bg-green-500' : done.bestScore >= 45 ? 'bg-amber-500' : 'bg-red-500';
                  return `<button onclick="PTE.App.loadQuestion(${i})" class="w-6 h-6 rounded ${c} text-white text-[9px] font-mono font-semibold flex items-center justify-center hover:opacity-80 transition-opacity" title="Q${i+1}: ${done.bestScore}/90">${i+1}</button>`;
                }
                return `<button onclick="PTE.App.loadQuestion(${i})" class="w-6 h-6 rounded bg-white/[0.03] text-zinc-600 text-[9px] font-mono flex items-center justify-center hover:bg-white/[0.06] transition-colors" title="Q${i+1}">${i+1}</button>`;
              }).join('')}
            </div>
          </div>`;
        })()}
        <div id="previous-answer" class="mb-4 hidden"></div>
        <div id="stepper-area" class="mb-3 hidden"></div>
        <div id="practice-area" class="card-elevated rounded-xl overflow-hidden"></div>
        <div id="score-area" class="mt-5 hidden"></div>
        <div id="action-buttons" class="mt-5 flex justify-center gap-3"></div>
      </div>
    </main>`;
  },

  // ── Predictions ───────────────────────────────────
  predictions() {
    const types = [PTE.QUESTION_TYPES, PTE.WRITING_TYPES, PTE.READING_TYPES, PTE.LISTENING_TYPES]
      .flatMap(m => m ? Object.values(m) : []);
    const predictions = PTE.Predictions || {};
    let totalPredictions = 0;
    const typeCounts = {};
    types.forEach(t => { const c = predictions[t.id] ? predictions[t.id].length : 0; typeCounts[t.id] = c; totalPredictions += c; });
    const sourceCounts = {};
    Object.values(predictions).forEach(arr => { (arr || []).forEach(q => { if (q.source) sourceCounts[q.source] = (sourceCounts[q.source] || 0) + 1; }); });

    const linkFor = (t) => {
      const m = t.module || 'speaking';
      if (m === 'writing') return `#/writing/${t.id}`;
      if (m === 'reading') return `#/reading/${t.id}`;
      if (m === 'listening') return `#/listening/${t.id}`;
      return `#/predictions/${t.id}`;
    };

    return `
    ${PTE.UI.navbar('predictions')}
    <main class="min-h-screen">
      <section class="px-4 py-12 md:py-16">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-full text-xs mb-4 text-amber-400 font-medium">Updated for 2025/2026</div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mb-2">Prediction Questions</h1>
          <p class="text-sm text-zinc-500 max-w-lg mx-auto mb-4">High-frequency questions from APEUni, Gurully, StormEduGo.</p>
          <div class="flex flex-wrap justify-center gap-2 mb-3">
            ${Object.entries(sourceCounts).map(([src, count]) => `<span class="text-[10px] font-medium px-2 py-1 rounded-full bg-white/[0.03] border border-[var(--border)] text-zinc-400">${src}: ${count}</span>`).join('')}
          </div>
          <p class="text-lg font-semibold text-amber-400 font-mono">${totalPredictions} total</p>
          <a href="#/researched-predictions" class="inline-flex mt-3 text-xs font-semibold text-cyan-300 hover:text-cyan-200">Open researched prediction set →</a>
        </div>
      </section>
      <div class="max-w-4xl mx-auto px-4 pb-10">
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
          ${types.map(t => {
            const count = typeCounts[t.id];
            if (count === 0) return '';
            const preds = predictions[t.id] || [];
            const veryHigh = preds.filter(q => q.frequency === 'very-high').length;
            const high = preds.filter(q => q.frequency === 'high').length;
            return `
            <a href="${linkFor(t)}" class="block group">
              <div class="card card-hover rounded-xl p-5">
                <div class="flex items-start justify-between mb-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style="background:${t.color}11">${t.icon}</div>
                  <span class="text-lg font-semibold text-amber-400 font-mono">${count}</span>
                </div>
                <h3 class="text-sm font-semibold text-zinc-200 mb-1 group-hover:text-amber-400 transition-colors">${t.name}</h3>
                <p class="text-xs text-zinc-500 mb-2">${t.description}</p>
                <div class="flex items-center gap-1.5">
                  ${veryHigh > 0 ? `<span class="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/8 text-red-400 border border-red-500/10">${veryHigh} Very High</span>` : ''}
                  ${high > 0 ? `<span class="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/8 text-amber-400 border border-amber-500/10">${high} High</span>` : ''}
                </div>
              </div>
            </a>`;
          }).join('')}
        </div>
      </div>
    </main>`;
  },

  // ── Publicly researched prediction samples ────────────────
  researchedPredictions() {
    const researched = [];
    Object.entries(PTE.Predictions || {}).forEach(([typeId, questions]) => {
      const type = Object.values(PTE.QUESTION_TYPES || {}).find(t => t.id === typeId);
      (questions || []).filter(q => q.frequency === 'research-sample').forEach(q => researched.push({ type, typeId, question: q }));
    });
    const grouped = researched.reduce((groups, item) => {
      (groups[item.typeId] ||= []).push(item);
      return groups;
    }, {});
    return `
    ${PTE.UI.navbar('predictions')}
    <main class="min-h-screen">
      <section class="px-4 py-10 md:py-14">
        <div class="max-w-4xl mx-auto">
          <a href="#/predictions" class="text-xs text-amber-400 hover:text-amber-300">← All predictions</a>
          <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="inline-flex items-center rounded-full bg-cyan-500/5 border border-cyan-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">Research-sourced</div>
              <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mt-3">Latest researched predictions</h1>
              <p class="text-sm text-zinc-500 mt-2 max-w-xl">A separate collection of publicly accessible sample material, kept apart from the main prediction bank.</p>
            </div>
            <span class="text-sm font-mono text-cyan-300">${researched.length} questions</span>
          </div>
          <div class="mt-8 space-y-5">
            ${Object.entries(grouped).map(([typeId, items]) => {
              const type = items[0].type;
              return `<section class="card-elevated rounded-2xl p-4 md:p-5">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-semibold text-zinc-200">${type ? `${type.icon} ${type.name}` : typeId}</h2>
                  <a href="#/predictions/${typeId}" class="text-[10px] font-semibold text-amber-400 hover:text-amber-300">Practice type →</a>
                </div>
                <div class="space-y-2">
                  ${items.map(({ question }) => {
                    const prompt = question.text || question.prompt || question.scenario || 'Chart practice sample';
                    return `<article class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3">
                      <div class="flex items-start justify-between gap-3">
                        <p class="text-sm leading-6 text-zinc-300">${prompt}</p>
                        <span class="shrink-0 text-[9px] uppercase tracking-[0.1em] text-cyan-300">${question.publishedAt || 'Research'}</span>
                      </div>
                      ${question.title ? `<p class="mt-2 text-xs text-zinc-500">${question.title}</p>` : ''}
                      ${question.sourceUrl ? `<a class="mt-2 inline-block text-[10px] text-zinc-500 underline hover:text-zinc-300" href="${question.sourceUrl}" target="_blank" rel="noopener">View public source</a>` : ''}
                    </article>`;
                  }).join('')}
                </div>
              </section>`;
            }).join('') || '<p class="text-sm text-zinc-500">No researched prediction samples are loaded.</p>'}
          </div>
          ${(() => {
            const findings = PTE.ResearchedPredictionFindings || {};
            return `
            <section class="mt-6 card-elevated rounded-2xl p-4 md:p-5">
              <h2 class="text-sm font-semibold text-zinc-200">Complete research findings</h2>
              <p class="text-xs text-zinc-500 mt-1">Public guidance and context collected alongside the sample questions.</p>
              <div class="mt-5">
                <h3 class="text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-semibold mb-2">Task guidance</h3>
                <div class="space-y-2">
                  ${(findings.taskGuidance || []).map(item => `<div class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3"><div class="flex flex-wrap items-center justify-between gap-2"><span class="text-xs font-semibold text-zinc-200">${item.task}</span><span class="text-[10px] text-zinc-600">${item.source}</span></div><p class="mt-1 text-xs leading-5 text-zinc-400">${item.finding}</p></div>`).join('')}
                </div>
              </div>
              <div class="mt-5">
                <h3 class="text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-semibold mb-2">Describe Image templates</h3>
                <div class="space-y-2">${(findings.describeImageTemplates || []).map((template, i) => `<div class="rounded-xl border border-[var(--border)] bg-white/[0.02] p-3 text-xs leading-5 text-zinc-400"><span class="mr-2 font-mono text-cyan-300">${i + 1}.</span>${template}</div>`).join('')}</div>
              </div>
              <div class="mt-5">
                <h3 class="text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-semibold mb-2">Research notes</h3>
                <ul class="space-y-2">${(findings.caveats || []).map(note => `<li class="text-xs leading-5 text-zinc-500">• ${note}</li>`).join('')}</ul>
              </div>
            </section>`;
          })()}
          <p class="mt-6 text-[10px] leading-5 text-zinc-600">These are unofficial practice samples. They are not guaranteed Pearson exam questions.</p>
        </div>
      </section>
    </main>`;
  },

  // ── Mock Test ─────────────────────────────────────
  mockTest() {
    const configs = PTE.Exam ? PTE.Exam.CONFIGS : {};
    const recentMocks = PTE.Store.getAll().sessions.filter(s => s.type === 'mock-test').slice(0, 5);
    let recentHtml = '';
    if (recentMocks.length > 0) {
      recentHtml = `
      <div class="mt-10">
        <h3 class="text-sm font-semibold text-zinc-200 mb-3">Recent Tests</h3>
        <div class="card-elevated rounded-xl overflow-hidden">
          <div class="divide-y divide-[var(--border)]">
            ${recentMocks.map(s => {
              const band = PTE.Scoring.getBand(s.overallScore);
              return `<div class="px-5 py-2.5 flex items-center gap-3"><div class="flex-1"><p class="text-sm text-zinc-300">${s.transcript || 'Mock Test'}</p><p class="text-[10px] text-zinc-600">${s.date}</p></div><span class="text-xs font-semibold font-mono" style="color:${band.color}">${s.overallScore}/90</span></div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
    }
    return `
    ${PTE.UI.navbar('mock-test')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="mb-6">
          <h1 class="text-xl font-semibold text-zinc-100 tracking-tight mb-1">Speaking Mock Test</h1>
          <p class="text-sm text-zinc-500">Simulate the real PTE Academic Speaking test.</p>
        </div>
        <div class="card rounded-xl p-4 mb-8 border-amber-500/10">
          <h3 class="text-xs font-semibold text-amber-400 mb-2">Exam Conditions</h3>
          <ul class="space-y-1 text-xs text-zinc-500">
            <li>Questions auto-advance — no pausing or going back</li>
            <li>Fixed preparation and recording time per question</li>
            <li>No feedback during the test — scores at the end</li>
            <li>Use Chrome browser for best speech recognition</li>
          </ul>
        </div>
        <div class="grid md:grid-cols-3 gap-3 stagger">
          ${Object.values(configs).map(cfg => {
            const totalQ = cfg.sections.reduce((s, sec) => s + sec.count, 0);
            return `
            <div class="card card-hover rounded-xl p-5">
              <div class="flex items-start justify-between mb-3">
                <span class="text-3xl">${cfg.icon}</span>
                <span class="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full text-white" style="background:${cfg.color}">${cfg.duration}</span>
              </div>
              <h3 class="text-sm font-semibold text-zinc-200 mb-1">${cfg.name}</h3>
              <p class="text-xs text-zinc-500 mb-3">${cfg.description}</p>
              <div class="space-y-1 mb-4">
                ${cfg.sections.map(sec => `<div class="flex items-center justify-between text-[10px]"><span class="text-zinc-500">${sec.label}</span><span class="text-zinc-400 font-mono">${sec.count}</span></div>`).join('')}
                <div class="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border)]"><span class="text-zinc-300 font-medium">Total</span><span class="text-zinc-200 font-mono font-semibold">${totalQ}</span></div>
              </div>
              <button onclick="PTE.Exam.start('${cfg.id}')" class="w-full btn-primary py-2.5 text-xs">Start Test</button>
            </div>`;
          }).join('')}
        </div>
        ${recentHtml}
      </div>
    </main>`;
  },

  // ── Login ─────────────────────────────────────────
  login() {
    return `
    <div class="min-h-screen flex flex-col">
      <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-sm">
          <div class="text-center mb-8">
            <div class="flex justify-center mb-4">${PTE.UI.brandMark(40)}</div>
            <h1 class="text-xl font-semibold text-zinc-100 tracking-tight mb-1">Welcome back</h1>
            <p class="text-sm text-zinc-500">Sign in to continue</p>
          </div>
          <div class="card-elevated rounded-xl p-6">
            <div id="login-error" class="hidden mb-4 p-3 rounded-lg bg-red-500/8 border border-red-500/10 text-red-400 text-xs font-medium" role="alert"></div>
            <form onsubmit="PTE.Auth._handleLogin(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <input type="email" id="login-email" required placeholder="you@example.com" class="input-dark">
              </div>
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                <div class="relative">
                  <input type="password" id="login-password" required placeholder="Enter password" class="input-dark !pr-10">
                  <button type="button" onclick="PTE.Auth._togglePassword('login-password', this)" class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>
              <button type="submit" id="login-btn" class="w-full btn-primary py-2.5">Sign In</button>
            </form>
            <div class="mt-5 pt-5 border-t border-[var(--border)] text-center">
              <p class="text-zinc-500 text-xs">No account? <a href="#/signup" class="text-[var(--accent-light)] font-medium hover:underline">Create one</a></p>
            </div>
          </div>
          <p class="text-center text-[10px] text-zinc-700 mt-5">Data stored locally on this device.</p>
        </div>
      </div>
    </div>`;
  },

  // ── Sign Up ───────────────────────────────────────
  signup() {
    return `
    <div class="min-h-screen flex flex-col">
      <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-sm">
          <div class="text-center mb-8">
            <div class="flex justify-center mb-4">${PTE.UI.brandMark(40)}</div>
            <h1 class="text-xl font-semibold text-zinc-100 tracking-tight mb-1">Create Account</h1>
            <p class="text-sm text-zinc-500">Start tracking your progress</p>
          </div>
          <div class="card-elevated rounded-xl p-6">
            <div id="signup-error" class="hidden mb-4 p-3 rounded-lg bg-red-500/8 border border-red-500/10 text-red-400 text-xs font-medium" role="alert"></div>
            <form onsubmit="PTE.Auth._handleSignup(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Username</label>
                <input type="text" id="signup-username" required placeholder="Choose a username" minlength="2" maxlength="30" class="input-dark">
              </div>
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <input type="email" id="signup-email" required placeholder="you@example.com" class="input-dark">
              </div>
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
                <div class="relative">
                  <input type="password" id="signup-password" required placeholder="Min 4 characters" minlength="4" class="input-dark !pr-10">
                  <button type="button" onclick="PTE.Auth._togglePassword('signup-password', this)" class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Confirm Password</label>
                <input type="password" id="signup-confirm" required placeholder="Re-enter password" class="input-dark">
              </div>
              <button type="submit" id="signup-btn" class="w-full btn-primary py-2.5">Create Account</button>
            </form>
            <div class="mt-5 pt-5 border-t border-[var(--border)] text-center">
              <p class="text-zinc-500 text-xs">Have an account? <a href="#/login" class="text-[var(--accent-light)] font-medium hover:underline">Sign in</a></p>
            </div>
          </div>
          <p class="text-center text-[10px] text-zinc-700 mt-5">Data stored locally on this device.</p>
        </div>
      </div>
    </div>`;
  },

  // ── Profile ───────────────────────────────────────
  profile() {
    const user = PTE.Auth.getCurrentUser();
    if (!user) { location.hash = '#/login'; return ''; }
    const initials = PTE.Auth.getInitials(user.username);
    const stats = PTE.Store.getStats();
    const overall = stats.overall || null;
    const gp = PTE.Gamify ? PTE.Gamify.getProgress() : null;

    let statsCards = '';
    if (overall) {
      statsCards = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-[var(--accent-light)]">${overall.totalAttempts}</p><p class="text-[10px] text-zinc-500 mt-1">Done</p></div>
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-green-400">${overall.averageScore}</p><p class="text-[10px] text-zinc-500 mt-1">Avg</p></div>
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-[var(--violet)]">${overall.bestScore}</p><p class="text-[10px] text-zinc-500 mt-1">Best</p></div>
        <div class="card rounded-xl p-4 text-center"><p class="text-2xl font-semibold font-mono text-amber-400">${overall.streak || 0}</p><p class="text-[10px] text-zinc-500 mt-1">Streak</p></div>
      </div>`;
    }

    let badgesHtml = '';
    if (gp && gp.badges.length > 0) {
      badgesHtml = `
      <div class="mb-8">
        <h3 class="text-sm font-semibold text-zinc-200 mb-3">Badges</h3>
        <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          ${gp.badges.map(b => `<div class="card rounded-lg p-2.5 text-center cursor-default" title="${b.name}: ${b.desc}"><span class="text-xl block mb-0.5">${b.icon}</span><p class="text-[9px] text-zinc-500 truncate">${b.name}</p></div>`).join('')}
        </div>
      </div>`;
    }

    return `
    ${PTE.UI.navbar('profile')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-2xl mx-auto">
        <div class="card-elevated rounded-xl p-6 mb-8">
          <div class="flex flex-col sm:flex-row items-center gap-5">
            <div class="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-semibold text-white" style="background:${user.avatarColor}">${initials}</div>
            <div class="flex-1 text-center sm:text-left">
              <h1 class="text-lg font-semibold text-zinc-100">${user.username}</h1>
              <p class="text-xs text-zinc-500 mb-1.5">${user.email}</p>
              <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span class="text-[10px] text-zinc-600 bg-white/[0.03] px-2 py-0.5 rounded-full">Since ${user.createdDate}</span>
                ${gp ? `<span class="badge badge-level">${gp.level.icon} Lv ${gp.level.level}</span><span class="badge badge-xp">${gp.xp} XP</span>` : ''}
              </div>
            </div>
          </div>
        </div>
        ${statsCards}
        ${badgesHtml}
        <div class="card rounded-xl p-5 mb-5">
          <h3 class="text-sm font-semibold text-zinc-200 mb-3">Edit Profile</h3>
          <div id="profile-msg" class="hidden mb-3 p-2.5 rounded-lg text-xs font-medium"></div>
          <div class="flex gap-2">
            <input type="text" id="profile-username" value="${user.username}" maxlength="30" class="input-dark flex-1">
            <button onclick="PTE.Auth._handleUpdateProfile()" class="btn-primary px-4 text-xs">Save</button>
          </div>
        </div>
        <div class="card rounded-xl p-5 mb-5">
          <h3 class="text-sm font-semibold text-zinc-200 mb-3">Change Password</h3>
          <div id="password-msg" class="hidden mb-3 p-2.5 rounded-lg text-xs font-medium"></div>
          <div class="space-y-3">
            <input type="password" id="current-password" placeholder="Current password" class="input-dark">
            <input type="password" id="new-password" placeholder="New password (min 4)" class="input-dark">
            <button onclick="PTE.Auth._handleChangePassword()" class="btn-primary px-4 text-xs">Update</button>
          </div>
        </div>
        <div class="card rounded-xl p-5 mb-5">
          <h3 class="text-sm font-semibold text-zinc-200 mb-2">Data & Backup</h3>
          <p class="text-xs text-zinc-500 mb-3">Your data is stored locally. Export for backup.</p>
          <div id="data-msg" class="hidden mb-3 p-2.5 rounded-lg text-xs font-medium"></div>
          <div class="flex flex-wrap gap-2">
            <button onclick="PTE.App._exportData()" class="btn-secondary px-3 py-2 text-xs">Export JSON</button>
            <label class="btn-secondary px-3 py-2 text-xs cursor-pointer">Import<input type="file" accept=".json" class="hidden" onchange="PTE.App._importData(event)"></label>
          </div>
        </div>
        <div class="card rounded-xl p-5 border-red-500/10">
          <h3 class="text-sm font-semibold text-red-400 mb-3">Account</h3>
          <div class="flex flex-wrap gap-2">
            <button onclick="PTE.Auth.logout()" class="btn-danger px-4 text-xs">Sign Out</button>
            <button onclick="if(confirm('Delete account and ALL data?')){PTE.Auth._deleteAccount()}" class="text-xs text-red-500/50 hover:text-red-400 px-3 py-2 transition-colors">Delete Account</button>
          </div>
        </div>
      </div>
    </main>`;
  }
};
