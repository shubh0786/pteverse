/**
 * PTEverse - Effects Engine (Minimal)
 * Scroll reveal, ripple, mobile bottom nav, dropdown escape
 */
window.PTE = window.PTE || {};

PTE.Effects = {
  _observer: null,

  init() {
    this.initScrollReveal();
    this.initRipple();
    this.initParallax();
    this.initMobileBottomNav();
    this.initDropdownEscape();

    window.addEventListener('hashchange', () => {
      setTimeout(() => {
        this.refreshScrollReveal();
        this.refreshMobileBottomNav();
      }, 100);
    });
  },

  initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    let frame = null;
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty('--pointer-x', `${(event.clientX / window.innerWidth - 0.5) * 2}`);
        root.style.setProperty('--pointer-y', `${(event.clientY / window.innerHeight - 0.5) * 2}`);
      });
    }, { passive: true });
  },

  // ── Scroll Reveal ──────────────────────────────────
  initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    this.refreshScrollReveal();
  },

  refreshScrollReveal() {
    if (!this._observer) return;
    document.querySelectorAll('.reveal').forEach(el => {
      if (!el.classList.contains('visible')) this._observer.observe(el);
    });
  },

  // ── Ripple Effect ──────────────────────────────────
  initRipple() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a[href]');
      if (!target || target.closest('.no-ripple')) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.width = wave.style.height = size + 'px';
      wave.style.left = x + 'px';
      wave.style.top = y + 'px';
      const pos = getComputedStyle(target).position;
      if (pos === 'static') target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(wave);
      setTimeout(() => wave.remove(), 500);
    });
  },

  // ── Dropdown Escape / Click Outside ────────────────
  initDropdownEscape() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('nav [id]:not(.hidden)').forEach(el => {
          if (el.id.startsWith('more-') || el.id.startsWith('user-menu-')) el.classList.add('hidden');
        });
        document.querySelectorAll('[id^="mobile-nav-"]:not(.hidden)').forEach(el => el.classList.add('hidden'));
      }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('nav')) {
        document.querySelectorAll('nav [id]').forEach(el => {
          if ((el.id.startsWith('more-') || el.id.startsWith('user-menu-')) && !el.classList.contains('hidden')) {
            el.classList.add('hidden');
          }
        });
      }
    });
  },

  // ── Mobile Bottom Navigation ───────────────────────
  initMobileBottomNav() {
    if (document.getElementById('mobile-bottom-nav')) return;
    const nav = document.createElement('div');
    nav.id = 'mobile-bottom-nav';
    nav.className = 'mobile-bottom-nav';
    document.body.appendChild(nav);
    this.refreshMobileBottomNav();
  },

  refreshMobileBottomNav() {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    const hash = location.hash.slice(1) || '/';
    if (hash === '/login' || hash === '/signup') { nav.style.display = 'none'; return; }
    nav.style.display = '';
    const currentPage = hash.split('/')[1] || '';
    const items = [
      { href: '#/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Home', page: '' },
      { href: '#/practice', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z', label: 'Practice', page: 'practice' },
      { href: '#/predictions', icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Predict', page: 'predictions' },
      { href: '#/progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Stats', page: 'progress' },
      { href: '#/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile', page: 'profile' },
    ];
    nav.innerHTML = items.map(item => {
      const active = currentPage === item.page;
      return `<a href="${item.href}" class="${active ? 'active' : ''}" aria-label="${item.label}" ${active ? 'aria-current="page"' : ''}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${item.icon}"/></svg>
        <span>${item.label}</span>
      </a>`;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => PTE.Effects.init(), 200);
});
