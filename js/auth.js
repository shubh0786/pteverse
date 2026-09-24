/**
 * PTEverse - Authentication Module
 * Handles user signup, login, logout, and per-user data isolation
 * All data stored in localStorage (client-side only)
 */
window.PTE = window.PTE || {};

PTE.Auth = {
  USERS_KEY: 'crackpte_users',
  SESSION_KEY: 'crackpte_session',
  // Temporary local preview bypass. Never enabled on deployed hosts.
  isLocalPreview() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  },

  getPreviewUser() {
    return {
      id: 'local-preview-user',
      username: 'Preview Student',
      email: 'preview@pteverse.local',
      avatarColor: '#8b7dff',
      createdDate: 'Local preview'
    };
  },

  // ── Storage Helpers ─────────────────────────────────────────

  getUsers() {
    try {
      let raw = localStorage.getItem(this.USERS_KEY);
      if (!raw) raw = sessionStorage.getItem(this.USERS_KEY); // fallback
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[Auth] Failed to read users:', e);
      return [];
    }
  },

  saveUsers(users) {
    const data = JSON.stringify(users);
    try { localStorage.setItem(this.USERS_KEY, data); } catch (e) { console.warn('[Auth] localStorage save users failed:', e); }
    try { sessionStorage.setItem(this.USERS_KEY, data); } catch (e) {} // backup
  },

  getSession() {
    try {
      // Try localStorage first, fall back to sessionStorage
      let raw = localStorage.getItem(this.SESSION_KEY);
      if (!raw) raw = sessionStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Auth] Failed to read session:', e);
      return null;
    }
  },

  saveSession(session) {
    const data = JSON.stringify(session);
    try { localStorage.setItem(this.SESSION_KEY, data); } catch (e) { console.warn('[Auth] localStorage save failed:', e); }
    try { sessionStorage.setItem(this.SESSION_KEY, data); } catch (e) {} // backup
  },

  clearSession() {
    try { localStorage.removeItem(this.SESSION_KEY); } catch (e) {}
    try { sessionStorage.removeItem(this.SESSION_KEY); } catch (e) {}
  },

  // ── Auth State ──────────────────────────────────────────────

  isLoggedIn() {
    if (this.isLocalPreview()) return true;
    const session = this.getSession();
    if (!session || !session.userId) {
      console.log('[Auth] No session found');
      return false;
    }
    const users = this.getUsers();
    const found = users.some(u => u.id === session.userId);
    if (!found) {
      console.log('[Auth] Session userId not found in users list, users count:', users.length);
    }
    return found;
  },

  getCurrentUser() {
    if (this.isLocalPreview()) return this.getPreviewUser();
    const session = this.getSession();
    if (!session || !session.userId) return null;
    const users = this.getUsers();
    return users.find(u => u.id === session.userId) || null;
  },

  getCurrentUserId() {
    if (this.isLocalPreview()) return this.getPreviewUser().id;
    const session = this.getSession();
    return session ? session.userId : null;
  },

  // ── Sign Up ─────────────────────────────────────────────────

  signup(username, email, password) {
    username = (username || '').trim();
    email = (email || '').trim().toLowerCase();
    password = password || '';

    // Validation
    if (!username || username.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters.' };
    }
    if (username.length > 30) {
      return { success: false, error: 'Username must be 30 characters or less.' };
    }
    if (!email || !this._isValidEmail(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    const users = this.getUsers();

    // Check duplicates
    if (users.some(u => u.email === email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'This username is already taken.' };
    }

    // Create user
    const user = {
      id: this._generateId(),
      username,
      email,
      passwordHash: this._hash(password),
      avatarColor: this._avatarColor(username),
      createdAt: Date.now(),
      createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };

    users.push(user);
    this.saveUsers(users);

    // Auto-login
    this.saveSession({ userId: user.id, loginAt: Date.now() });
    this.activateUserStorage();

    return { success: true, user };
  },

  // ── Login ───────────────────────────────────────────────────

  login(email, password) {
    email = (email || '').trim().toLowerCase();
    password = password || '';

    if (!email || !password) {
      return { success: false, error: 'Please enter your email and password.' };
    }

    const users = this.getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }

    if (user.passwordHash !== this._hash(password)) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Set session
    this.saveSession({ userId: user.id, loginAt: Date.now() });
    this.activateUserStorage();

    return { success: true, user };
  },

  // ── Logout ──────────────────────────────────────────────────

  logout() {
    if (this.isLocalPreview()) {
      location.hash = '#/';
      return;
    }
    this.clearSession();
    if (PTE.Cloud) PTE.Cloud.logout();
    this._resetStorageKeys();
    location.hash = '#/login';
  },

  // ── Update Profile ──────────────────────────────────────────

  updateProfile(updates) {
    const session = this.getSession();
    if (!session) return { success: false, error: 'Not logged in.' };

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return { success: false, error: 'User not found.' };

    if (updates.username) {
      const newName = updates.username.trim();
      if (newName.length < 2) return { success: false, error: 'Username must be at least 2 characters.' };
      if (newName.length > 30) return { success: false, error: 'Username must be 30 characters or less.' };
      // Check uniqueness (excluding current user)
      if (users.some((u, i) => i !== idx && u.username.toLowerCase() === newName.toLowerCase())) {
        return { success: false, error: 'This username is already taken.' };
      }
      users[idx].username = newName;
      users[idx].avatarColor = this._avatarColor(newName);
    }

    this.saveUsers(users);
    return { success: true, user: users[idx] };
  },

  changePassword(currentPassword, newPassword) {
    const session = this.getSession();
    if (!session) return { success: false, error: 'Not logged in.' };

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return { success: false, error: 'User not found.' };

    if (users[idx].passwordHash !== this._hash(currentPassword)) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters.' };
    }

    users[idx].passwordHash = this._hash(newPassword);
    this.saveUsers(users);
    return { success: true };
  },

  // ── Per-User Storage Isolation ──────────────────────────────
  // Updates all module STORAGE_KEYs to include the user ID suffix
  // so each user's data is completely separate

  activateUserStorage() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const suffix = '_u_' + userId;

    // Update every module's storage key
    if (PTE.Store) PTE.Store.STORAGE_KEY = 'pte_speaking_progress' + suffix;
    if (PTE.Store) PTE.Store.EXAM_RUNS_KEY = 'pte_exam_runs' + suffix;
    if (PTE.Gamify) PTE.Gamify.STORAGE_KEY = 'crackpte_gamify' + suffix;
    if (PTE.Daily) PTE.Daily.STORAGE_KEY = 'crackpte_daily' + suffix;
    if (PTE.Vocab) PTE.Vocab.STORAGE_KEY = 'crackpte_vocab' + suffix;
    if (PTE.Spaced) PTE.Spaced.STORAGE_KEY = 'crackpte_spaced' + suffix;
    if (PTE.Leaderboard) PTE.Leaderboard.STORAGE_KEY = 'crackpte_leaderboard' + suffix;
    if (PTE.Challenge) PTE.Challenge.STORAGE_KEY = 'crackpte_challenges' + suffix;
    if (PTE.Drills) PTE.Drills.STORAGE_KEY = 'crackpte_drills' + suffix;
    if (PTE.Planner) PTE.Planner.STORAGE_KEY = 'crackpte_planner' + suffix;
    if (PTE.AccentAnalyzer) PTE.AccentAnalyzer.STORAGE_KEY = 'crackpte_accent' + suffix;
    if (PTE.TargetScore) PTE.TargetScore.STORAGE_KEY = 'crackpte_target' + suffix;
    if (PTE.WeakWords) PTE.WeakWords.STORAGE_KEY = 'crackpte_weakwords' + suffix;
    if (PTE.Reminders) PTE.Reminders.STORAGE_KEY = 'crackpte_reminders' + suffix;
  },

  _resetStorageKeys() {
    if (PTE.Store) PTE.Store.STORAGE_KEY = 'pte_speaking_progress';
    if (PTE.Store) PTE.Store.EXAM_RUNS_KEY = 'pte_exam_runs';
    if (PTE.Gamify) PTE.Gamify.STORAGE_KEY = 'crackpte_gamify';
    if (PTE.Daily) PTE.Daily.STORAGE_KEY = 'crackpte_daily';
    if (PTE.Vocab) PTE.Vocab.STORAGE_KEY = 'crackpte_vocab';
    if (PTE.Spaced) PTE.Spaced.STORAGE_KEY = 'crackpte_spaced';
    if (PTE.Leaderboard) PTE.Leaderboard.STORAGE_KEY = 'crackpte_leaderboard';
    if (PTE.Challenge) PTE.Challenge.STORAGE_KEY = 'crackpte_challenges';
    if (PTE.Drills) PTE.Drills.STORAGE_KEY = 'crackpte_drills';
    if (PTE.Planner) PTE.Planner.STORAGE_KEY = 'crackpte_planner';
    if (PTE.AccentAnalyzer) PTE.AccentAnalyzer.STORAGE_KEY = 'crackpte_accent';
    if (PTE.TargetScore) PTE.TargetScore.STORAGE_KEY = 'crackpte_target';
    if (PTE.WeakWords) PTE.WeakWords.STORAGE_KEY = 'crackpte_weakwords';
    if (PTE.Reminders) PTE.Reminders.STORAGE_KEY = 'crackpte_reminders';
  },

  // ── Utility Functions ───────────────────────────────────────

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  _generateId() {
    return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  },

  // Simple hash for local password storage (not cryptographic - client-side only)
  _hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  },

  _avatarColor(name) {
    const colors = [
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#ef4444', '#f97316',
      '#eab308', '#84cc16', '#22c55e', '#10b981',
      '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  },

  // ── UI Form Handlers (called from page templates) ──────────

  _togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    // Swap icon
    btn.innerHTML = isPassword
      ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>'
      : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>';
  },

  async _handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    if (PTE.Cloud) {
      const cloud = await PTE.Cloud.login(email, password);
      if (cloud.success && cloud.user) {
        this.saveSession({ userId: cloud.user.id, loginAt: Date.now(), cloud: true });
        const users = this.getUsers();
        if (!users.some((u) => u.id === cloud.user.id)) {
          users.push({
            id: cloud.user.id,
            username: cloud.user.username,
            email: cloud.user.email,
            passwordHash: this._hash(password),
            avatarColor: this._avatarColor(cloud.user.username),
            createdAt: Date.now(),
            createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            cloud: true
          });
          this.saveUsers(users);
        }
        this.activateUserStorage();
        location.hash = '#/';
        return;
      }
    }

    const result = this.login(email, password);
    if (result.success) {
      location.hash = '#/';
    } else {
      errorEl.textContent = result.error;
      errorEl.classList.remove('hidden');
    }
  },

  async _handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const errorEl = document.getElementById('signup-error');

    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match.';
      errorEl.classList.remove('hidden');
      return;
    }

    if (PTE.Cloud) {
      const cloud = await PTE.Cloud.signup(email, password, username);
      if (cloud.success && cloud.user) {
        const local = this.signup(username, email, password);
        if (!local.success && local.error && local.error.indexOf('already exists') !== -1) {
          this.login(email, password);
        }
        location.hash = '#/';
        return;
      }
    }

    const result = this.signup(username, email, password);
    if (result.success) {
      location.hash = '#/';
    } else {
      errorEl.textContent = result.error;
      errorEl.classList.remove('hidden');
    }
  },

  _handleUpdateProfile() {
    const username = document.getElementById('profile-username').value;
    const msgEl = document.getElementById('profile-msg');
    const result = this.updateProfile({ username });
    msgEl.classList.remove('hidden');
    if (result.success) {
      msgEl.className = 'mb-4 p-3 rounded-xl text-sm font-medium bg-emerald-500/15 border border-emerald-500/20 text-emerald-400';
      msgEl.textContent = 'Profile updated successfully!';
      // Refresh page to update navbar
      setTimeout(() => PTE.App.renderPage('profile'), 500);
    } else {
      msgEl.className = 'mb-4 p-3 rounded-xl text-sm font-medium bg-red-500/15 border border-red-500/20 text-red-400';
      msgEl.textContent = result.error;
    }
  },

  _handleChangePassword() {
    const current = document.getElementById('current-password').value;
    const newPwd = document.getElementById('new-password').value;
    const msgEl = document.getElementById('password-msg');
    const result = this.changePassword(current, newPwd);
    msgEl.classList.remove('hidden');
    if (result.success) {
      msgEl.className = 'mb-4 p-3 rounded-xl text-sm font-medium bg-emerald-500/15 border border-emerald-500/20 text-emerald-400';
      msgEl.textContent = 'Password changed successfully!';
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
    } else {
      msgEl.className = 'mb-4 p-3 rounded-xl text-sm font-medium bg-red-500/15 border border-red-500/20 text-red-400';
      msgEl.textContent = result.error;
    }
  },

  _deleteAccount() {
    const session = this.getSession();
    if (!session) return;

    const userId = session.userId;
    const suffix = '_u_' + userId;

    // Remove all user data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.endsWith(suffix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Remove user from users list
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);

    // Clear session
    this.clearSession();
    this._resetStorageKeys();
    location.hash = '#/login';
  }
};
