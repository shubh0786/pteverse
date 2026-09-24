/**
 * PTE Speaking Module - UI Components (Redesigned)
 * Clean, minimal component library inspired by Linear/Vercel
 */

window.PTE = window.PTE || {};

PTE.UI = {
  /** Brand mark inline SVG */
  brandMark(size = 32) {
    const gradientId = `pte-mark-gradient-${Math.round(size)}-${Math.random().toString(16).slice(2, 8)}`;
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="${gradientId}" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stop-color="#8B7DFF"/>
          <stop offset="0.56" stop-color="#7A6CFF"/>
          <stop offset="1" stop-color="#17D7D0"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#${gradientId})"/>
      <path d="M24 18h13a11 11 0 0 1 0 22H24V18Z" fill="none" stroke="white" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M24 18v28" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="44.5" cy="20" r="8" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="2.4"/>
      <path d="M44.5 12c5 0 9 4 9 8.5" stroke="rgba(255,255,255,0.8)" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="44.5" cy="20" r="2.2" fill="white"/>
    </svg>`;
  },

  /** Navigation bar */
  navbar(activePage) {
    const navId = 'mobile-nav-' + Date.now();
    const links = [
      { href:'#/', label:'Home', page:'home' },
      { href:'#/practice', label:'Speaking', page:'practice' },
      { href:'#/command-center', label:'Command Center', page:'command-center' },
      { href:'#/writing', label:'Writing', page:'writing' },
      { href:'#/reading', label:'Reading', page:'reading' },
      { href:'#/listening', label:'Listening', page:'listening' },
      { href:'#/mock-test', label:'Mock Test', page:'mock-test' },
    ];
    const moreGroups = [
      { label:'Practice', items:[
        { href:'#/smart-practice', label:'Smart Practice', page:'smart-practice', icon:'🧠' },
        { href:'#/pressure', label:'Pressure Training', page:'pressure', icon:'⏱️' },
        { href:'#/fluency', label:'Fluency Lab', page:'fluency', icon:'🗣️' },
        { href:'#/drills', label:'Pronunciation Drills', page:'drills', icon:'🎙️' },
        { href:'#/daily', label:'Daily Challenge', page:'daily', icon:'⚡' },
      ]},
      { label:'Study', items:[
        { href:'#/vocab', label:'Vocab Builder', page:'vocab', icon:'🃏' },
        { href:'#/templates', label:'Templates', page:'templates', icon:'📝' },
        { href:'#/skills-coach', label:'Skills Coach', page:'skills-coach', icon:'🎯' },
        { href:'#/review', label:'Spaced Review', page:'review', icon:'🧠' },
        { href:'#/planner', label:'Study Planner', page:'planner', icon:'📋' },
        { href:'#/notebook', label:'Mistake Notebook', page:'notebook', icon:'📓' },
      ]},
      { label:'Tools', items:[
        { href:'#/target', label:'Target Score', page:'target', icon:'🎯' },
        { href:'#/accent', label:'Accent Coach', page:'accent', icon:'🗣️' },
        { href:'#/weak-words', label:'Weak Word Drill', page:'weak-words', icon:'🎙️' },
        { href:'#/score-predictor', label:'Score Predictor', page:'score-predictor', icon:'🔮' },
        { href:'#/leaderboard', label:'Leaderboard', page:'leaderboard', icon:'🏆' },
        { href:'#/challenge-create', label:'Challenge Friend', page:'challenge-create', icon:'⚔️' },
        { href:'#/reminders', label:'Study Reminders', page:'reminders', icon:'🔔' },
      ]},
    ];
    const moreLinks = moreGroups.flatMap(g => g.items);

    const dLink = l => `<a href="${l.href}" class="px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activePage===l.page?'bg-[var(--accent-surface)] text-[var(--accent-light)]':'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'}">${l.label}</a>`;
    const mLink = l => `<a href="${l.href}" onclick="document.getElementById('${navId}').classList.add('hidden')" class="block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activePage===l.page?'bg-[var(--accent-surface)] text-[var(--accent-light)]':'text-zinc-400 hover:bg-white/[0.03]'}">${l.label}</a>`;
    const moreId = 'more-' + Date.now();
    const userMenuId = 'user-menu-' + Date.now();
    const moreActive = moreLinks.some(l => l.page === activePage);
    const xpBar = PTE.Gamify ? PTE.Gamify.renderXPBar() : '';

    const user = PTE.Auth ? PTE.Auth.getCurrentUser() : null;
    const initials = user ? PTE.Auth.getInitials(user.username) : '';
    const avatarColor = user ? user.avatarColor : '#6d5cff';
    const userBtn = user ? `
      <div class="relative">
        <button onclick="document.getElementById('${userMenuId}').classList.toggle('hidden')" class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors" aria-label="User menu">
          <div class="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold text-white" style="background:${avatarColor}">${initials}</div>
          <svg class="w-3.5 h-3.5 text-zinc-600 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="${userMenuId}" class="hidden absolute right-0 top-full mt-2 w-52 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] shadow-xl shadow-black/40 py-1.5 z-50">
          <div class="px-4 py-2.5 border-b border-[var(--border)]">
            <p class="text-sm font-medium text-zinc-200 truncate">${user.username}</p>
            <p class="text-xs text-zinc-500 truncate">${user.email}</p>
          </div>
          <a href="#/profile" onclick="document.getElementById('${userMenuId}').classList.add('hidden')" class="flex items-center gap-2.5 px-4 py-2 text-sm ${activePage==='profile'?'text-[var(--accent-light)]':'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'} transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Profile
          </a>
          <button onclick="PTE.Auth.logout()" class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sign Out
          </button>
        </div>
      </div>` : '';

    return `
    <nav class="bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div class="max-w-5xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-12">
          <a href="#/" class="flex items-center gap-2.5" aria-label="PTEverse Home">
            ${this.brandMark(28)}
            <span class="font-semibold text-zinc-100 text-sm tracking-tight">PTEverse</span>
          </a>
          <div class="hidden md:flex items-center gap-0.5">
            ${links.map(dLink).join('')}
            <div class="relative">
              <button onclick="document.getElementById('${moreId}').classList.toggle('hidden')" class="px-3 py-1.5 rounded-md text-sm font-medium transition-all ${moreActive?'bg-[var(--accent-surface)] text-[var(--accent-light)]':'text-zinc-500 hover:text-zinc-300'}">More <svg class="w-3 h-3 inline ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
              <div id="${moreId}" class="hidden absolute right-0 top-full mt-2 w-56 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] shadow-xl shadow-black/40 py-1 z-50 max-h-[70vh] overflow-y-auto">
                ${moreGroups.map((g, gi) => `
                  ${gi > 0 ? '<div class="border-t border-[var(--border)] my-1"></div>' : ''}
                  <p class="px-4 pt-2 pb-1 text-[10px] text-zinc-600 uppercase tracking-wider font-medium">${g.label}</p>
                  ${g.items.map(l => `<a href="${l.href}" onclick="document.getElementById('${moreId}').classList.add('hidden')" class="block px-4 py-1.5 text-sm ${activePage===l.page?'text-[var(--accent-light)] bg-[var(--accent-surface)]':'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'} transition-all">${l.label}</a>`).join('')}
                `).join('')}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="hidden sm:block">${xpBar}</div>
            ${userBtn}
            <button onclick="document.getElementById('${navId}').classList.toggle('hidden')" class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.04] transition-colors" aria-label="Open menu">
              <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div id="${navId}" class="hidden md:hidden bg-[var(--surface-1)] border-t border-[var(--border)] px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
        <div class="sm:hidden mb-3 pb-3 border-b border-[var(--border)]">${xpBar}</div>
        ${user ? `
        <div class="flex items-center gap-3 px-3 py-2.5 mb-2 bg-[var(--surface-2)] rounded-lg">
          <div class="w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold text-white" style="background:${avatarColor}">${initials}</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-zinc-200 truncate">${user.username}</p>
            <p class="text-xs text-zinc-500 truncate">${user.email}</p>
          </div>
        </div>` : ''}
        ${links.map(mLink).join('')}
        ${moreGroups.map(g => `
        <div class="border-t border-[var(--border)] mt-2 pt-2">
          <p class="text-xs text-zinc-600 px-4 py-1 uppercase tracking-wider font-medium">${g.label}</p>
          ${g.items.map(mLink).join('')}
        </div>`).join('')}
        ${user ? `
        <div class="border-t border-[var(--border)] mt-2 pt-2">
          <a href="#/profile" onclick="document.getElementById('${navId}').classList.add('hidden')" class="block px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-white/[0.03]">Profile</a>
          <button onclick="PTE.Auth.logout()" class="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/5">Sign Out</button>
        </div>` : ''}
      </div>
    </nav>
    <div class="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
      <a href="#/" class="${activePage==='home'?'active':''}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></svg>
        <span>Home</span>
      </a>
      <a href="#/practice" class="${activePage==='practice'?'active':''}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
        <span>Speak</span>
      </a>
      <a href="#/writing" class="${activePage==='writing'?'active':''}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        <span>Write</span>
      </a>
      <a href="#/reading" class="${activePage==='reading'?'active':''}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <span>Read</span>
      </a>
      <a href="#/listening" class="${activePage==='listening'?'active':''}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
        <span>Listen</span>
      </a>
    </div>`;
  },

  /** Circular timer */
  timer(id = 'timer') {
    return `
    <div id="${id}" class="relative inline-flex items-center justify-center">
      <svg class="w-24 h-24 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
        <circle id="${id}-circle" cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="5" 
          stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="0"
          class="transition-all duration-1000"/>
      </svg>
      <div class="absolute flex flex-col items-center">
        <span id="${id}-time" class="text-xl font-semibold text-zinc-100 font-mono tabular-nums">0:00</span>
        <span id="${id}-label" class="text-[10px] text-zinc-500 font-medium"></span>
      </div>
    </div>`;
  },

  updateTimer(id, remaining, total, label = '') {
    const circle = document.getElementById(`${id}-circle`);
    const timeEl = document.getElementById(`${id}-time`);
    const labelEl = document.getElementById(`${id}-label`);
    if (timeEl) {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    if (circle) {
      const progress = total > 0 ? (1 - remaining / total) : 0;
      circle.style.strokeDashoffset = 326.73 * progress;
      circle.style.stroke = remaining <= 5 ? 'var(--error)' : remaining <= 10 ? 'var(--warning)' : 'var(--accent)';
    }
    if (labelEl) labelEl.textContent = label;
  },

  /** Waveform canvas */
  waveform(id = 'waveform') {
    return `<canvas id="${id}" class="w-full h-16 rounded-lg bg-white/[0.02]" style="max-width:480px"></canvas>`;
  },

  drawWaveform(canvasId, dataArray, color = '#6d5cff') {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !dataArray) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    ctx.clearRect(0, 0, width, height);
    const barCount = 48;
    const barWidth = (width / barCount) * 0.6;
    const gap = (width / barCount) * 0.4;
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * dataArray.length / barCount);
      const value = dataArray[dataIndex] / 255;
      const barHeight = Math.max(3, value * height * 0.8);
      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;
      ctx.fillStyle = color + (value > 0.3 ? 'cc' : '44');
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  },

  /** Score card */
  scoreCard(overallScore, scores, type, feedback) {
    const band = PTE.Scoring.getBand(overallScore);
    const typeConfig = Object.values(PTE.QUESTION_TYPES).find(t => t.id === type);

    let scoreBreakdown = '';
    if (scores.contentResult) {
      const cr = scores.contentResult;
      if (type === 'read-aloud') {
        scoreBreakdown += this.traitBar('Content', cr.raw, cr.max, `${cr.accuracy}% accuracy`);
      } else if (type === 'repeat-sentence') {
        const labels = ['Almost nothing', 'Less than 50%', 'At least 50%', 'All correct'];
        scoreBreakdown += this.traitBar('Content', cr.band, cr.max, labels[cr.band] || '');
      } else {
        const labels = ['Too limited', 'Disconnected', 'Minimal', 'Superficial', 'Basic', 'Main features', 'Full & nuanced'];
        const traitName = (cr.traitName === 'Appropriacy') ? 'Appropriacy' : 'Content';
        scoreBreakdown += this.traitBar(traitName, cr.raw, cr.max, labels[cr.raw] || '');
      }
    } else if (scores.content !== undefined) {
      scoreBreakdown += this.scoreBar('Content', scores.content);
    }
    if (scores.pronunciation !== undefined) {
      const pLabels = ['Non-English', 'Intrusive', 'Intermediate', 'Good', 'Advanced', 'Native-like'];
      scoreBreakdown += this.traitBar('Pronunciation', scores.pronunciation, 5, pLabels[scores.pronunciation] || '');
    }
    if (scores.fluency !== undefined) {
      const fLabels = ['Disfluent', 'Limited', 'Intermediate', 'Good', 'Advanced', 'Native-like'];
      scoreBreakdown += this.traitBar('Oral Fluency', scores.fluency, 5, fLabels[scores.fluency] || '');
    }
    if (scores.vocabulary !== undefined) {
      scoreBreakdown += this.traitBar('Vocabulary', scores.vocabulary, 1, scores.vocabulary === 1 ? 'Correct' : 'Incorrect');
    }

    let feedbackHtml = '';
    if (feedback && feedback.length > 0) {
      feedbackHtml = `
      <div class="mt-5 space-y-2">
        <h4 class="text-sm font-medium text-zinc-300">Feedback</h4>
        ${feedback.map(f => `<div class="flex items-start gap-2.5 p-2.5 bg-white/[0.02] rounded-lg"><span class="text-[var(--accent)] mt-0.5 flex-shrink-0 text-xs">&#9679;</span><p class="text-xs text-zinc-400 leading-relaxed">${f}</p></div>`).join('')}
      </div>`;
    }

    return `
    <div class="card-elevated overflow-hidden max-w-md mx-auto animate-fadeIn">
      <div class="bg-gradient-to-r from-[#6d5cff] to-[#a78bfa] p-5 text-center">
        <p class="text-white/60 text-xs font-medium mb-1">${typeConfig ? typeConfig.name : 'Speaking'} Score</p>
        <div class="relative inline-flex items-center justify-center my-2">
          <svg class="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="5"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-dasharray="326.73" stroke-dashoffset="${326.73*(1-overallScore/90)}" class="score-circle-animate"/>
          </svg>
          <div class="absolute flex flex-col items-center">
            <span class="text-3xl font-bold text-white font-mono tabular-nums">${overallScore}</span>
            <span class="text-[10px] text-white/40 font-mono">/90</span>
          </div>
        </div>
        <div class="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
          <span class="text-xs">${band.emoji}</span>
          <span class="text-white text-xs font-medium">${band.label}</span>
        </div>
      </div>
      <div class="p-5">
        <h4 class="text-sm font-medium text-zinc-300 mb-3">Trait Scores <span class="text-xs text-zinc-600">(Official PTE Scale)</span></h4>
        <div class="space-y-3">${scoreBreakdown}</div>
        ${feedbackHtml}
      </div>
    </div>`;
  },

  traitBar(label, score, maxScore, descriptor) {
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const ratio = maxScore > 0 ? score / maxScore : 0;
    let color;
    if (ratio >= 0.8) color = 'var(--success)';
    else if (ratio >= 0.6) color = 'var(--accent)';
    else if (ratio >= 0.4) color = 'var(--warning)';
    else color = 'var(--error)';

    return `
    <div>
      <div class="flex justify-between items-center mb-1">
        <span class="text-xs font-medium text-zinc-400">${label}</span>
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-zinc-500">${descriptor}</span>
          <span class="text-xs font-semibold font-mono tabular-nums" style="color:${color}">${score}/${maxScore}</span>
        </div>
      </div>
      <div class="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div class="h-full rounded-full score-bar-animate" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>`;
  },

  scoreBar(label, score) {
    const pct = (score / 90) * 100;
    let color;
    if (score >= 70) color = 'var(--success)';
    else if (score >= 50) color = 'var(--accent)';
    else if (score >= 30) color = 'var(--warning)';
    else color = 'var(--error)';
    return `
    <div>
      <div class="flex justify-between items-center mb-1">
        <span class="text-xs font-medium text-zinc-400">${label}</span>
        <span class="text-xs font-semibold font-mono" style="color:${color}">${score}/90</span>
      </div>
      <div class="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div class="h-full rounded-full score-bar-animate" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>`;
  },

  /** Question type card */
  typeCard(type) {
    const stats = PTE.Store.getStats()[type.id];
    const attemptsText = stats ? `${stats.totalAttempts} attempts · Avg: ${stats.averageScore}/90` : 'No attempts yet';
    const questionCount = PTE.Questions[type.id] ? PTE.Questions[type.id].length : 0;
    const predictionCount = PTE.Predictions && PTE.Predictions[type.id] ? PTE.Predictions[type.id].length : 0;

    return `
    <a href="#/practice/${type.id}" class="block group">
      <div class="card card-hover rounded-xl p-5 transition-all">
        <div class="flex items-start justify-between mb-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style="background:${type.color}11">${type.icon}</div>
          <div class="flex flex-col items-end gap-1">
            <span class="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full" style="background:${type.color}11;color:${type.color}">${type.shortName}</span>
            <span class="text-[10px] text-zinc-600">${questionCount} Qs</span>
          </div>
        </div>
        <h3 class="font-semibold text-zinc-200 text-sm mb-1 group-hover:text-[var(--accent-light)] transition-colors">${type.name}</h3>
        <p class="text-xs text-zinc-500 mb-2 line-clamp-2">${type.description}</p>
        <div class="flex items-center gap-1.5 text-[10px] text-zinc-600">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Prep: ${type.prepTime}s · Record: ${type.recordTime}s
        </div>
        ${predictionCount > 0 ? `<div class="mt-2"><span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/8 text-amber-400 border border-amber-500/10">${predictionCount} Predictions</span></div>` : ''}
        <div class="mt-2.5 pt-2.5 border-t border-[var(--border)]">
          <p class="text-[10px] text-zinc-600">${attemptsText}</p>
        </div>
      </div>
    </a>`;
  },

  /** Tips panel */
  tipsPanel(tips) {
    return `
    <div class="card rounded-lg p-4 mb-5 border-amber-500/15">
      <h4 class="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
        Tips
      </h4>
      <ul class="space-y-1">
        ${tips.map(t => `<li class="text-xs text-zinc-400 flex items-start gap-2"><span class="text-amber-500/60 mt-0.5">-</span>${t}</li>`).join('')}
      </ul>
    </div>`;
  },

  /** Loading spinner */
  spinner(text = 'Loading...') {
    return `
    <div class="flex flex-col items-center justify-center py-20" role="status">
      <div class="w-8 h-8 border-2 border-zinc-800 border-t-[var(--accent)] rounded-full animate-spin mb-3"></div>
      <p class="text-zinc-500 text-sm">${text}</p>
    </div>`;
  },

  /** Empty state */
  emptyState(icon, title, description, ctaText, ctaHref) {
    return `
    <div class="text-center py-16 animate-fadeIn">
      <div class="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
        <span class="text-3xl">${icon}</span>
      </div>
      <h3 class="text-base font-semibold text-zinc-200 mb-1">${title}</h3>
      <p class="text-zinc-500 text-sm max-w-sm mx-auto mb-5">${description}</p>
      ${ctaText && ctaHref ? `<a href="${ctaHref}" class="btn-primary">${ctaText}</a>` : ''}
    </div>`;
  },

  /** Pronunciation highlight */
  pronunciationHighlight(expectedText, transcript) {
    if (!expectedText) return '';
    const expWords = expectedText.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w);
    const recNorm = (transcript || '').toLowerCase().replace(/[^\w\s'-]/g, ' ');
    const recWords = recNorm.split(/\s+/).filter(w => w);
    const expNorm = expWords.map(w => w.toLowerCase().replace(/[^\w'-]/g, ''));
    const lcsResult = PTE.Scoring._lcsWords(expNorm, recWords);
    const closeMatchSet = new Set();
    for (let i = 0; i < expNorm.length; i++) {
      if (lcsResult.expIndices.has(i)) continue;
      for (let j = 0; j < recWords.length; j++) {
        if (lcsResult.recIndices.has(j)) continue;
        const dist = PTE.Scoring.levenshtein(expNorm[i], recWords[j]);
        if (dist <= 2 && dist < Math.max(expNorm[i].length, recWords[j].length) * 0.5) { closeMatchSet.add(i); break; }
      }
    }
    const wordSpans = expWords.map((word, i) => {
      const exactMatch = lcsResult.expIndices.has(i);
      const closeMatch = closeMatchSet.has(i);
      let cls;
      if (exactMatch) cls = 'bg-green-500/10 text-green-400 border-green-500/15';
      else if (closeMatch) cls = 'bg-amber-500/10 text-amber-400 border-amber-500/15';
      else cls = 'bg-red-500/10 text-red-400 border-red-500/15';
      const safeWord = word.replace(/'/g, "\\'");
      return `<span class="inline-flex items-center px-1.5 py-0.5 rounded border text-xs font-medium cursor-pointer transition-colors hover:brightness-125 ${cls}" onclick="PTE.pronounceWord('${safeWord}')">${word}</span>`;
    });
    const matchedCount = lcsResult.expIndices.size;
    const closeCount = closeMatchSet.size;
    const totalWords = expWords.length;
    const pct = totalWords > 0 ? Math.round(((matchedCount + closeCount * 0.5) / totalWords) * 100) : 0;

    return `
    <div class="mt-4 card-elevated overflow-hidden max-w-md mx-auto animate-fadeIn">
      <div class="bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3">
        <h3 class="text-white text-xs font-semibold text-center">Pronunciation Comparison</h3>
        <p class="text-white/50 text-[10px] text-center mt-0.5">Click any word to hear it</p>
      </div>
      <div class="p-4">
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1 text-[10px] text-zinc-500"><span class="w-2.5 h-2.5 rounded bg-green-500/15 border border-green-500/20 inline-block"></span>Correct</span>
            <span class="flex items-center gap-1 text-[10px] text-zinc-500"><span class="w-2.5 h-2.5 rounded bg-amber-500/15 border border-amber-500/20 inline-block"></span>Close</span>
            <span class="flex items-center gap-1 text-[10px] text-zinc-500"><span class="w-2.5 h-2.5 rounded bg-red-500/15 border border-red-500/20 inline-block"></span>Missed</span>
          </div>
          <span class="text-[10px] font-semibold font-mono ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}">${pct}%</span>
        </div>
        <div class="flex flex-wrap gap-1 leading-relaxed">${wordSpans.join('')}</div>
        <div class="mt-3 pt-3 border-t border-[var(--border)]">
          <button onclick="PTE.pronounceText()" class="text-xs font-medium text-[var(--accent-light)] hover:text-[var(--accent)] transition-colors">Listen to full text</button>
        </div>
      </div>
    </div>`;
  },

  /** Model answer script */
  modelAnswerScript(type, question) {
    const script = PTE.ModelAnswers ? PTE.ModelAnswers.getScript(type, question) : null;
    if (!script) return '';
    return `
    <div class="mt-4 card-elevated overflow-hidden max-w-md mx-auto animate-fadeIn">
      <div class="bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3">
        <h3 class="text-white text-xs font-semibold text-center">Model Answer</h3>
      </div>
      <div class="p-4">
        ${script.intro ? `<p class="text-[11px] text-zinc-500 mb-2">${script.intro}</p>` : ''}
        <div class="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 mb-3">
          <p class="text-sm text-zinc-200 leading-relaxed" id="model-answer-text">${script.text}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="PTE.pronounceModelAnswer()" class="text-xs font-medium px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/15 hover:bg-amber-500/15 transition-colors">Listen</button>
          <button onclick="PTE.pronounceModelAnswer(0.8)" class="text-xs text-zinc-500 px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors">Slow</button>
        </div>
        ${script.tips ? `
        <div class="mt-3 pt-3 border-t border-[var(--border)]">
          <p class="text-[10px] font-medium text-zinc-500 mb-1">Key points:</p>
          <ul class="space-y-0.5">
            ${script.tips.map(t => `<li class="text-[11px] text-zinc-500 flex items-start gap-1.5"><span class="text-amber-500/50 mt-0.5">-</span>${t}</li>`).join('')}
          </ul>
        </div>` : ''}
      </div>
    </div>`;
  },

  /** Practice flow stepper */
  practiceFlowStepper(currentPhase, hasAudio) {
    const steps = [];
    if (hasAudio) steps.push({ id:'listening', label:'Listen', num:1 });
    steps.push({ id:'prep', label:'Prepare', num: hasAudio ? 2 : 1 });
    steps.push({ id:'recording', label:'Record', num: hasAudio ? 3 : 2 });
    steps.push({ id:'review', label:'Review', num: hasAudio ? 4 : 3 });
    const phaseOrder = ['idle','listening','prep','recording','evaluating','review'];
    const currentIdx = phaseOrder.indexOf(currentPhase);
    return `
    <div class="practice-stepper" id="practice-stepper" role="progressbar">
      ${steps.map((s, i) => {
        const stepIdx = phaseOrder.indexOf(s.id);
        const isDone = currentIdx > stepIdx;
        const isActive = currentPhase === s.id || (s.id === 'review' && currentPhase === 'evaluating');
        const dotClass = isDone ? 'done' : isActive ? 'active' : '';
        const labelClass = isDone ? 'done' : isActive ? 'active' : '';
        const icon = isDone ? '&#10003;' : s.num;
        const line = i > 0 ? `<div class="step-line ${isDone || isActive ? 'done' : ''}"></div>` : '';
        return `${line}<div class="step flex flex-col items-center"><div class="step-dot ${dotClass}">${icon}</div><div class="step-label ${labelClass}">${s.label}</div></div>`;
      }).join('')}
    </div>`;
  },

  /** Skeleton cards */
  skeletonCards(count = 4) {
    return `<div class="grid sm:grid-cols-2 lg:grid-cols-${Math.min(count, 4)} gap-4">
      ${Array(count).fill(0).map(() => `
        <div class="skeleton-card">
          <div class="flex items-start justify-between mb-4">
            <div class="skeleton skeleton-circle" style="width:40px;height:40px"></div>
            <div class="skeleton" style="width:36px;height:20px;border-radius:10px"></div>
          </div>
          <div class="skeleton skeleton-text" style="width:65%"></div>
          <div class="skeleton skeleton-text" style="width:100%"></div>
          <div class="skeleton skeleton-text" style="width:45%"></div>
        </div>
      `).join('')}
    </div>`;
  },

  /** Keyboard hint */
  kbdHint(key, label) {
    return `<span class="hidden md:inline-flex items-center gap-1 text-[10px] text-zinc-600"><span class="kbd">${key}</span> ${label}</span>`;
  },

  /** Sparkline */
  sparkline(scores, width = 80, height = 24) {
    if (!scores || scores.length < 2) return '';
    const max = Math.max(...scores, 1);
    const min = Math.min(...scores, 0);
    const range = max - min || 1;
    const points = scores.map((s, i) => {
      const x = (i / (scores.length - 1)) * width;
      const y = height - ((s - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');
    return `<svg width="${width}" height="${height}" class="inline-block"><polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
};
