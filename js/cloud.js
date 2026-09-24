/**
 * Netlify Identity + progress sync. Falls back to localStorage when Identity is off.
 */
window.PTE = window.PTE || {};

PTE.Cloud = {
  identityBase: '/.netlify/identity',
  syncUrl: '/api/sync',
  available: null,
  accessToken: null,
  identityUser: null,

  async probe() {
    if (this.available !== null) return this.available;
    try {
      const res = await fetch(this.identityBase, { method: 'GET' });
      this.available = res.ok || res.status === 404 ? res.ok : false;
      if (res.ok) {
        const data = await res.json().catch(() => null);
        this.available = !!(data && (data.external || data.disable_signup !== undefined || data.name));
      }
    } catch {
      this.available = false;
    }
    return this.available;
  },

  authHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.accessToken) headers.Authorization = 'Bearer ' + this.accessToken;
    return headers;
  },

  async signup(email, password, username) {
    if (!(await this.probe())) return { success: false, skipped: true };
    try {
      const res = await fetch(this.identityBase + '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, data: { full_name: username } })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data.error_description || data.msg || 'Cloud signup failed' };
      return this._acceptToken(data, username, email);
    } catch (e) {
      return { success: false, skipped: true, error: e.message };
    }
  },

  async login(email, password) {
    if (!(await this.probe())) return { success: false, skipped: true };
    try {
      const body = new URLSearchParams();
      body.set('grant_type', 'password');
      body.set('username', email);
      body.set('password', password);
      const res = await fetch(this.identityBase + '/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data.error_description || data.msg || 'Cloud login failed' };
      return this._acceptToken(data, email.split('@')[0], email);
    } catch (e) {
      return { success: false, skipped: true, error: e.message };
    }
  },

  _acceptToken(data, username, email) {
    this.accessToken = data.access_token || (data.token && data.token.access_token) || null;
    const user = data.user || {};
    const id = user.id || user.sub || ('cloud_' + email);
    this.identityUser = {
      id,
      email: user.email || email,
      username: (user.user_metadata && user.user_metadata.full_name) || username,
      cloud: true
    };
    try { sessionStorage.setItem('pte_cloud_token', this.accessToken || ''); } catch (e) {}
    return { success: !!this.accessToken, user: this.identityUser, token: this.accessToken };
  },

  restoreToken() {
    try { this.accessToken = sessionStorage.getItem('pte_cloud_token') || localStorage.getItem('pte_cloud_token'); } catch (e) { this.accessToken = null; }
  },

  logout() {
    this.accessToken = null;
    this.identityUser = null;
    try {
      sessionStorage.removeItem('pte_cloud_token');
      localStorage.removeItem('pte_cloud_token');
    } catch (e) {}
  },

  async pull() {
    this.restoreToken();
    if (!this.accessToken) return null;
    try {
      const res = await fetch(this.syncUrl, { headers: this.authHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async push(payload) {
    this.restoreToken();
    if (!this.accessToken) return { ok: false, skipped: true };
    try {
      const res = await fetch(this.syncUrl, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(payload || {})
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  async syncNow() {
    const local = PTE.Store ? PTE.Store.getAll() : { sessions: [] };
    const examRuns = PTE.Store && PTE.Store.getExamRuns ? PTE.Store.getExamRuns() : [];
    const vocab = PTE.Vocab && PTE.Vocab.getData ? PTE.Vocab.getData() : null;
    const gamify = PTE.Gamify && PTE.Gamify.getData ? PTE.Gamify.getData() : null;
    return this.push({
      sessions: local.sessions || [],
      examRuns,
      vocab,
      gamify
    });
  },

  applyRemote(remote) {
    if (!remote || !PTE.Store) return;
    const local = PTE.Store.getAll();
    const sessions = Array.isArray(local.sessions) ? local.sessions : [];
    const seen = new Set(sessions.map((s) => this.recordKey(s)));
    (Array.isArray(remote.sessions) ? remote.sessions : []).forEach((session) => {
      const key = this.recordKey(session);
      if (!seen.has(key)) {
        sessions.push(session);
        seen.add(key);
      }
    });
    sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    local.sessions = sessions;
    PTE.Store.updateStats(local);
    PTE.Store.save(local, false);

    if (Array.isArray(remote.examRuns)) {
      const runs = PTE.Store.getExamRuns();
      const runKeys = new Set(runs.map((run) => String(run.id || run.timestamp || '')));
      remote.examRuns.forEach((run) => {
        const key = String(run.id || run.timestamp || '');
        if (key && !runKeys.has(key)) {
          runs.push(run);
          runKeys.add(key);
        }
      });
      runs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      PTE.Store.replaceExamRuns(runs);
    }
    if (remote.vocab && PTE.Vocab && PTE.Vocab.save) PTE.Vocab.save(remote.vocab);
    if (remote.gamify && PTE.Gamify && PTE.Gamify.save) PTE.Gamify.save(remote.gamify);
  },

  recordKey(record) {
    if (!record) return '';
    if (record.id) return String(record.id);
    if (record.timestamp || record.questionId) {
      return `${record.timestamp || ''}:${record.questionId || ''}`;
    }
    return JSON.stringify(record);
  }
};
