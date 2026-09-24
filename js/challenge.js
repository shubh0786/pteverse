/**
 * PTEverse - Challenge a Friend
 * Generate shareable challenge URLs, compare scores
 */
window.PTE = window.PTE || {};

PTE.Challenge = {
  STORAGE_KEY: 'crackpte_challenges',

  getData() { try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {}; } catch(e) { return {}; } },
  save(data) { try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data)); } catch(e) {} },

  /**
   * Create a new challenge with 5 random questions
   * Returns a URL-safe encoded string
   */
  create() {
    const types = ['read-aloud','repeat-sentence','describe-image','answer-short-question','retell-lecture'];
    const seed = Date.now().toString(36);
    const picks = [];
    types.forEach(type => {
      const bank = PTE.Questions[type] || [];
      if (bank.length > 0) {
        const q = bank[Math.floor(Math.random() * bank.length)];
        picks.push({ type, id: q.id });
      }
    });

    const payload = { v: 2, seed, picks };
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const url = window.location.origin + window.location.pathname + '#/challenge/' + code;
    return { code, url, picks, seed };
  },

  /**
   * Decode a challenge code
   */
  decode(code) {
    try {
      const padded = String(code).replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - String(code).length % 4) % 4);
      const parsed = JSON.parse(decodeURIComponent(escape(atob(padded))));
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.picks)) return parsed.picks;
      return null;
    } catch(e) { return null; }
  },

  /**
   * Get questions from a challenge code
   */
  getQuestions(code) {
    const picks = this.decode(code);
    if (!picks) return [];
    return picks.map(p => {
      const bank = PTE.Questions[p.type] || [];
      const question = bank.find(q => q.id === p.id);
      const tc = Object.values(PTE.QUESTION_TYPES).find(t => t.id === p.type);
      if (question && tc) return { type: p.type, typeConfig: tc, question };
      return null;
    }).filter(Boolean);
  },

  /**
   * Save challenge result
   */
  saveResult(code, scores) {
    const data = this.getData();
    if (!data[code]) data[code] = [];
    const name = (PTE.Leaderboard && PTE.Leaderboard.getMyName()) || 'You';
    const avg = scores.length > 0 ? Math.round(scores.reduce((a,b) => a + b, 0) / scores.length) : 0;
    data[code].push({ name, scores, avg, date: new Date().toLocaleDateString() });
    this.save(data);
    return avg;
  },

  renderCreatePage() {
    return `
    ${PTE.UI.navbar('home')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <span class="text-5xl mb-4 block">⚔️</span>
        <h1 class="text-3xl font-semibold text-zinc-100 mb-2">Challenge a Friend</h1>
        <p class="text-zinc-500 mb-8">Generate a link with 5 random questions. Share it with your friend and compare scores!</p>

        <div class="card-elevated rounded-xl p-6 mb-6">
          <button onclick="PTE.Challenge.generateLink()" id="gen-btn" class="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-600 text-zinc-100 font-semibold text-lg hover:opacity-90 transition-all shadow-xl shadow-[rgba(109,92,255,0.15)]">
            ⚡ Generate Challenge
          </button>
          <div id="challenge-link-area" class="hidden mt-6">
            <label class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2 block">Share this link:</label>
            <div class="flex gap-2">
              <input id="challenge-url" readonly class="flex-1 bg-white/[0.02] border border-[var(--border)] rounded-xl px-4 py-3 text-cyan-400 text-sm font-mono truncate">
              <button onclick="navigator.clipboard.writeText(document.getElementById('challenge-url').value).then(()=>this.textContent='Copied!')" class="px-4 py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/25 transition-all">Copy</button>
            </div>
            <p class="text-xs text-zinc-600 mt-3">Anyone with this URL gets the same five questions. Scores stay on each device unless you use cloud sync.</p>
          </div>
        </div>

        <!-- Recent challenges -->
        ${this._renderRecent()}
      </div>
    </main>`;
  },

  generateLink() {
    const { url } = this.create();
    const area = document.getElementById('challenge-link-area');
    const input = document.getElementById('challenge-url');
    if (area) area.classList.remove('hidden');
    if (input) input.value = url;
  },

  renderChallengePage(code) {
    const questions = this.getQuestions(code);
    if (questions.length === 0) {
      return `${PTE.UI.navbar('home')}<main class="min-h-screen py-10 px-4"><div class="max-w-2xl mx-auto text-center py-20"><span class="text-5xl mb-4 block">❌</span><h2 class="text-2xl font-semibold text-zinc-100 mb-2">Invalid Challenge</h2><p class="text-zinc-500">This challenge link is invalid or expired.</p></div></main>`;
    }

    // Check if already completed
    const data = this.getData();
    const existing = data[code] || [];
    const myName = (PTE.Leaderboard && PTE.Leaderboard.getMyName()) || 'You';
    const myResult = existing.find(r => r.name === myName);

    if (myResult) {
      // Show results
      return this.renderResults(code);
    }

    const rows = questions.map((q, i) => `
      <div class="flex items-center gap-3 py-3 ${i < questions.length - 1 ? 'border-b border-[var(--border)]' : ''}">
        <span class="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-[var(--accent-surface)]">${q.typeConfig.icon}</span>
        <span class="text-sm font-medium text-zinc-100">${q.typeConfig.name}</span>
      </div>`).join('');

    return `
    ${PTE.UI.navbar('home')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <span class="text-5xl mb-4 block">⚔️</span>
        <h1 class="text-3xl font-semibold text-zinc-100 mb-2">Challenge Accepted!</h1>
        <p class="text-zinc-500 mb-6">${questions.length} questions to answer</p>
        <div class="card rounded-xl p-5 mb-6 text-left">${rows}</div>
        <button onclick="PTE.Challenge.startChallenge('${code}')" class="w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-600 text-zinc-100 font-semibold text-lg hover:opacity-90 transition-all shadow-xl">⚡ Start Challenge</button>
      </div>
    </main>`;
  },

  async startChallenge(code) {
    const questions = this.getQuestions(code);
    this._challengeCode = code;
    this._challengeScores = [];
    this._challengeIndex = 0;
    this._challengeQuestions = questions;

    // Sequentially run each question
    for (let i = 0; i < questions.length; i++) {
      this._challengeIndex = i;
      const q = questions[i];

      // Set up the practice flow
      PTE.App.currentType = q.type;
      PTE.App.currentTypeConfig = q.typeConfig;
      PTE.App.currentQuestions = [q.question];
      PTE.App.currentQuestionIndex = 0;
      PTE.App.currentQuestion = q.question;

      const root = document.getElementById('app-root');
      root.innerHTML = `
        ${PTE.UI.navbar('home')}
        <main class="min-h-screen py-4 px-4">
          <div class="max-w-3xl mx-auto">
            <div class="flex items-center justify-between mb-4">
              <span class="badge badge-level">Challenge Q${i+1}/${questions.length}</span>
              <span class="text-sm text-zinc-500">${q.typeConfig.icon} ${q.typeConfig.name}</span>
            </div>
            <div id="practice-area" class="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden"></div>
            <div id="score-area" class="mt-6 hidden"></div>
            <div id="action-buttons" class="mt-6 flex justify-center gap-4"></div>
          </div>
        </main>`;

      PTE.App.showQuestionContent();

      // Wait for user to complete this question
      await new Promise(resolve => { this._challengeResolve = resolve; });
    }

    // Save and show results
    const avg = this.saveResult(code, this._challengeScores);
    if (PTE.Gamify) {
      const r = PTE.Gamify.awardXP(avg, 'challenge', false, false);
      PTE.Gamify.showToast(r);
    }
    PTE.Router.navigate('/challenge/' + code);
  },

  // Called from evaluation to advance challenge
  onQuestionComplete(score) {
    if (this._challengeScores) {
      this._challengeScores.push(score);
    }
    if (this._challengeResolve) {
      setTimeout(() => this._challengeResolve(), 2000);
      this._challengeResolve = null;
    }
  },

  renderResults(code) {
    const data = this.getData();
    const results = data[code] || [];
    results.sort((a, b) => b.avg - a.avg);

    const rows = results.map((r, i) => `
      <div class="flex items-center gap-4 py-3 ${i < results.length - 1 ? 'border-b border-[var(--border)]' : ''}">
        <span class="w-8 text-center font-semibold ${i === 0 ? 'text-2xl' : 'text-zinc-500'}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i + 1}</span>
        <div class="flex-1"><p class="text-sm font-semibold text-zinc-100">${r.name}</p><p class="text-xs text-zinc-600">${r.date}</p></div>
        <span class="text-lg font-extrabold font-mono text-[var(--accent-light)]">${r.avg}/90</span>
      </div>`).join('');

    return `
    ${PTE.UI.navbar('home')}
    <main class="min-h-screen py-10 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <span class="text-5xl mb-4 block">🏆</span>
        <h1 class="text-3xl font-semibold text-zinc-100 mb-2">Challenge Results</h1>
        <div class="card-elevated rounded-xl p-6 mt-6 text-left">${rows}</div>
        <div class="flex gap-4 justify-center mt-6">
          <a href="#/challenge-create" class="px-6 py-3 card rounded-xl text-[var(--accent-light)] font-semibold text-sm hover:bg-white/[0.02] transition-all">New Challenge</a>
          <a href="#/" class="px-6 py-3 bg-[var(--accent-surface)] border border-[rgba(109,92,255,0.12)] rounded-xl text-[var(--accent-light)] font-semibold text-sm hover:bg-[rgba(109,92,255,0.15)] transition-all">Home</a>
        </div>
      </div>
    </main>`;
  },

  _renderRecent() {
    const data = this.getData();
    const codes = Object.keys(data);
    if (codes.length === 0) return '';
    const recent = codes.slice(-5).reverse();
    const rows = recent.map(code => {
      const results = data[code];
      const best = results.reduce((a, b) => a.avg > b.avg ? a : b);
      return `<div class="flex items-center gap-3 py-2"><span class="text-zinc-600 text-xs font-mono truncate flex-1">${code.slice(0,20)}...</span><span class="text-sm font-semibold font-mono text-[var(--accent-light)]">${best.avg}/90</span></div>`;
    }).join('');
    return `<div class="card rounded-xl p-5 text-left mt-6"><h3 class="font-semibold text-zinc-100 text-sm mb-3">Recent Challenges</h3>${rows}</div>`;
  }
};
