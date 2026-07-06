/* ==========================================================================
   INDIGO MUSEUM — app.js
   Boot: Lenis smooth scroll, custom cursor, Spotify player,
         page transitions, header/footer injection.
   ========================================================================== */

/* Swap for any track/album on RM's "Indigo" record. Album ID also works via
   /embed/album/<id>. Track shown below is "Wild Flower" — the lead single. */
const SPOTIFY_TRACK_ID = "24S1RozdCkGpvpm1XjyKKt";
const SPOTIFY_EMBED_URL = `https://open.spotify.com/embed/track/${SPOTIFY_TRACK_ID}?utm_source=generator&theme=0`;
const IS_TOUCH = () => window.matchMedia('(max-width: 767px)').matches;

/* ---------- Lenis smooth scroll ---------- */
function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return null;
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    lerp: IS_TOUCH() ? 0.13 : 0.09,
  });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  window.__lenis = lenis;
  return lenis;
}

/* ---------- Custom cursor ---------- */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let rx = x, ry = y;
  let dx = x, dy = y;

  window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });

  function loop() {
    dx += (x - dx) * 0.55;
    dy += (y - dy) * 0.55;
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const hoverSel = 'a, button, [data-hover], input, textarea, .placard, .stamp-slot, .book-spine, .sticker, .collection-item';
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest(hoverSel);
    if (el) document.body.classList.add('cursor-hover');
    if (e.target.closest('[data-artwork]')) document.body.classList.add('cursor-artwork');
  });
  document.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest(hoverSel)) {
      document.body.classList.remove('cursor-hover');
    }
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-artwork]')) {
      document.body.classList.remove('cursor-artwork');
    }
  });
}

/* ---------- Spotify player ----------
   The .music-toggle button (top-right in the header) opens/closes a floating
   Spotify Embed. The <iframe> is lazy-mounted on first open so the network
   request only fires when the user actually asks for the player. State is
   persisted across pages via localStorage 'rkive_spotify_open'. */
function initSpotifyPlayer() {
  const btn = document.querySelector('.music-toggle');
  const player = document.querySelector('.spotify-player');
  if (!btn || !player) return;

  const frameWrap = player.querySelector('.spotify-player__frame');
  const closeBtn = player.querySelector('.spotify-player__close');
  const hasGSAP = typeof gsap !== 'undefined';

  let open = localStorage.getItem('rkive_spotify_open') === 'true';
  let iframeMounted = false;

  const mountFrame = () => {
    if (iframeMounted) return;
    const iframe = document.createElement('iframe');
    iframe.src = SPOTIFY_EMBED_URL;
    iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Spotify player');
    frameWrap.appendChild(iframe);
    iframeMounted = true;
  };

  const applyBtn = () => {
    btn.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close Spotify player' : 'Open Spotify player');
  };

  const showPlayer = ({ animate }) => {
    mountFrame();
    player.style.visibility = 'visible';
    if (hasGSAP && animate) {
      if (IS_TOUCH()) {
        gsap.fromTo(player,
          { yPercent: 100, autoAlpha: 1 },
          { yPercent: 0, duration: 0.5, ease: 'power3.out' }
        );
      } else {
        gsap.fromTo(player,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }
        );
      }
    } else {
      player.style.opacity = '1';
      player.style.transform = 'none';
    }
  };

  const hidePlayer = ({ animate }) => {
    if (hasGSAP && animate) {
      if (IS_TOUCH()) {
        gsap.to(player, {
          yPercent: 100, duration: 0.4, ease: 'power2.in',
          onComplete: () => { player.style.visibility = 'hidden'; }
        });
      } else {
        gsap.to(player, {
          autoAlpha: 0, y: 24, duration: 0.4, ease: 'power2.in',
          onComplete: () => { player.style.visibility = 'hidden'; }
        });
      }
    } else {
      player.style.opacity = '0';
      player.style.visibility = 'hidden';
    }
  };

  // Restore state on page load — no animation on rehydrate.
  if (open) showPlayer({ animate: false });
  applyBtn();

  const toggle = () => {
    open = !open;
    localStorage.setItem('rkive_spotify_open', open);
    applyBtn();
    open ? showPlayer({ animate: true }) : hidePlayer({ animate: true });
  };

  btn.addEventListener('click', toggle);
  closeBtn?.addEventListener('click', () => {
    if (!open) return;
    open = false;
    localStorage.setItem('rkive_spotify_open', 'false');
    applyBtn();
    hidePlayer({ animate: true });
  });
}

/* ---------- Page transitions ---------- */
function initTransitions() {
  const curtain = document.createElement('div');
  curtain.className = 'curtain';
  document.body.appendChild(curtain);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto') || a.target === '_blank' || a.hasAttribute('download')) return;
    e.preventDefault();
    curtain.classList.add('up');
    setTimeout(() => { window.location.href = href; }, 620);
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) curtain.classList.remove('up', 'away');
  });

  // Fade curtain out on load
  requestAnimationFrame(() => {
    curtain.classList.remove('up');
  });
}

/* ---------- Navigation ---------- */

/* Ordered walk-through of the museum — Prev/Next follow this order */
const NAV_ORDER = [
  { id: 'home',     label: 'Home',           href: 'index.html' },
  { id: 'lobby',    label: 'Gallery Map',    href: 'lobby.html' },
  { id: 'gallery1', label: 'Gallery 01',     href: 'gallery1.html', gallery: 'g1' },
  { id: 'gallery2', label: 'Gallery 02',     href: 'gallery2.html', gallery: 'g2' },
  { id: 'gallery3', label: 'Gallery 03',     href: 'gallery3.html', gallery: 'g3' },
  { id: 'gallery4', label: 'Gallery 04',     href: 'gallery4.html', gallery: 'g4' },
  { id: 'gallery5', label: 'Gallery 05',     href: 'gallery5.html', gallery: 'g5' },
  { id: 'gallery6', label: 'Gallery 06',     href: 'gallery6.html', gallery: 'g6' },
  { id: 'gallery7', label: 'Gallery 07',     href: 'gallery7.html', gallery: 'g7' },
  { id: 'stickers', label: 'Stickers',       href: 'stickers.html' },
  { id: 'letter',   label: 'Birthday Letter', href: 'letter.html' },
];

const GALLERY_ITEMS = NAV_ORDER.filter((n) => n.gallery);

function getCurrentPage() {
  return document.body.dataset.page || 'home';
}

function completedGalleryIds() {
  if (typeof Stamps === 'undefined') return [];
  try { return Stamps.get() || []; } catch { return []; }
}

/* ---------- Chrome header/footer ---------- */
function injectChrome() {
  if (!document.querySelector('.site-header')) {
    const currentId = getCurrentPage();
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `
      <div class="nav-inner">
        <a href="index.html" class="brand" aria-label="Indigo Museum home">
          <span class="brand__mark" aria-hidden="true">◆</span>
          <span class="brand__name">Indigo Museum</span>
        </a>

        <nav class="site-nav" aria-label="Primary">
          <a href="index.html"  data-nav="home">Home</a>
          <a href="lobby.html"  data-nav="lobby">Gallery Map</a>

          <div class="nav-dropdown" data-nav="galleries">
            <button type="button" class="nav-dropdown__trigger" aria-expanded="false" aria-haspopup="true">
              Galleries <span class="chev" aria-hidden="true">▾</span>
            </button>
            <ul class="nav-dropdown__menu" role="menu"></ul>
          </div>

          <a href="stickers.html" data-nav="stickers">Stickers</a>
          <a href="letter.html"   data-nav="letter" class="nav-letter">
            <span class="lock-icon" aria-hidden="true">✦</span>
            <span class="nav-letter__label">Letter</span>
          </a>
        </nav>

        <div class="nav-actions">
          <a href="#" class="nav-btn nav-btn--prev" data-nav-prev aria-label="Previous page">←</a>
          <a href="lobby.html" class="nav-btn nav-btn--back" data-nav-back>Back to Museum</a>
          <a href="#" class="nav-btn nav-btn--next" data-nav-next aria-label="Next page">→</a>
          <a href="lobby.html" class="stamp-pill" id="stampPill">
            <span class="stamp-pill__dot"></span>
            <span id="stampCount">0/7</span>
          </a>
          <button class="music-toggle" type="button" aria-expanded="false" aria-label="Open Spotify player">♪</button>
          <button class="nav-hamburger" type="button" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <div class="nav-progress" data-progress hidden>
        <span class="nav-progress__label">Gallery <b id="navProgressCurrent">01</b> / 07</span>
        <div class="nav-progress__dots" id="navProgressDots"></div>
      </div>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    // Spotify floating player (iframe is mounted lazily on first open).
    if (!document.querySelector('.spotify-player')) {
      const sp = document.createElement('aside');
      sp.className = 'spotify-player';
      sp.setAttribute('aria-label', 'Spotify player');
      sp.innerHTML = `
        <div class="spotify-player__bar">
          <span class="spotify-player__label">Now Playing</span>
          <button type="button" class="spotify-player__close" aria-label="Close player">×</button>
        </div>
        <div class="spotify-player__frame"></div>
      `;
      document.body.appendChild(sp);
    }

    // Mobile drawer (rendered once here, revealed via .is-open on <body>)
    if (!document.querySelector('.mobile-drawer')) {
      const drawer = document.createElement('div');
      drawer.className = 'mobile-drawer';
      drawer.setAttribute('aria-hidden', 'true');
      drawer.innerHTML = `
        <div class="mobile-drawer__panel">
          <button type="button" class="mobile-drawer__close" aria-label="Close menu">×</button>
          <ul class="mobile-drawer__list"></ul>
        </div>
      `;
      document.body.appendChild(drawer);
    }

    // Floating back button — desktop hides it, mobile CSS reveals on non-lobby/index pages
    if (!document.querySelector('.floating-back') && !['home', 'lobby'].includes(currentId)) {
      const fab = document.createElement('a');
      fab.className = 'floating-back';
      fab.href = 'lobby.html';
      fab.setAttribute('aria-label', 'Back to Museum');
      fab.innerHTML = '←';
      document.body.appendChild(fab);
    }
  }

  if (!document.querySelector('.site-footer')) {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <strong>Fanmade Birthday Project</strong>
      This is an unofficial fanmade birthday exhibition created by ARMY.<br>
      It is not affiliated with BIGHIT MUSIC, HYBE, or BTS.<br>
      <span style="opacity:0.75;">Dedicated to Kim Namjoon · 12 September</span>
      <div class="site-footer__credit">
        <div class="site-footer__copyright">© 2026 Indigo Museum</div>
        <div class="site-footer__created">Created by</div>
        <div class="site-footer__creators">
          <a class="site-footer__creator" href="https://instagram.com/purplora.studio" target="_blank" rel="noopener noreferrer" aria-label="purplora.studio on Instagram">
            <svg class="site-footer__ig" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.5" y1="6.5" y2="6.5"/>
            </svg>
            <span class="site-footer__handle">@purplora.studio</span>
          </a>
          <span class="site-footer__amp" aria-hidden="true">&amp;</span>
          <a class="site-footer__creator" href="https://instagram.com/zhfkamila" target="_blank" rel="noopener noreferrer" aria-label="zhfkamila on Instagram">
            <svg class="site-footer__ig" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.5" y1="6.5" y2="6.5"/>
            </svg>
            <span class="site-footer__handle">@zhfkamila</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }
}

/* Build the Galleries dropdown list, marking completed / current items */
function buildGalleryDropdown() {
  const list = document.querySelector('.nav-dropdown__menu');
  if (!list) return;
  const currentId = getCurrentPage();
  const completed = completedGalleryIds();

  list.innerHTML = GALLERY_ITEMS.map((g) => {
    const isCurrent = g.id === currentId;
    const isComplete = completed.includes(g.gallery);
    const cls = [
      'nav-dropdown__item',
      isCurrent ? 'is-current' : '',
      isComplete ? 'is-complete' : '',
    ].filter(Boolean).join(' ');
    const marker = isComplete
      ? '<span class="nav-dropdown__mark" aria-label="Completed">✓</span>'
      : isCurrent
        ? '<span class="nav-dropdown__mark nav-dropdown__mark--current" aria-hidden="true">●</span>'
        : '<span class="nav-dropdown__mark nav-dropdown__mark--pending" aria-hidden="true"></span>';
    return `
      <li role="none">
        <a class="${cls}" role="menuitem" href="${g.href}">
          ${marker}
          <span>${g.label}</span>
        </a>
      </li>
    `;
  }).join('');
}

/* Highlight the current section in the main nav */
function highlightCurrentNav() {
  const currentId = getCurrentPage();
  document.querySelectorAll('.site-nav > a[data-nav]').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.nav === currentId);
  });
  const galleriesTrigger = document.querySelector('.nav-dropdown');
  if (galleriesTrigger) {
    const isGalleryPage = /^gallery\d$/.test(currentId);
    galleriesTrigger.classList.toggle('is-active', isGalleryPage);
  }
}

/* Configure Prev / Next / Back buttons based on current page */
function setPrevNext() {
  const currentId = getCurrentPage();
  const idx = NAV_ORDER.findIndex((n) => n.id === currentId);
  const prev = idx > 0 ? NAV_ORDER[idx - 1] : null;
  const next = idx >= 0 && idx < NAV_ORDER.length - 1 ? NAV_ORDER[idx + 1] : null;

  const prevBtn = document.querySelector('[data-nav-prev]');
  const nextBtn = document.querySelector('[data-nav-next]');
  const backBtn = document.querySelector('[data-nav-back]');

  if (prevBtn) {
    if (prev) { prevBtn.href = prev.href; prevBtn.title = prev.label; prevBtn.hidden = false; }
    else prevBtn.hidden = true;
  }
  if (nextBtn) {
    if (next) { nextBtn.href = next.href; nextBtn.title = next.label; nextBtn.hidden = false; }
    else nextBtn.hidden = true;
  }
  if (backBtn) {
    // Hide back on Home and Lobby (Lobby IS the museum hub)
    backBtn.hidden = ['home', 'lobby'].includes(currentId);
  }
}

/* Letter is locked until all 7 stamps are collected */
function updateLetterLock() {
  const link = document.querySelector('.nav-letter');
  if (!link) return;
  const complete = completedGalleryIds().length >= 7;
  link.classList.toggle('is-locked', !complete);
  if (!complete) {
    link.setAttribute('aria-disabled', 'true');
  } else {
    link.removeAttribute('aria-disabled');
  }
  link.addEventListener('click', (e) => {
    if (link.classList.contains('is-locked')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showLockToast();
    }
  }, { capture: true });
}

function showLockToast() {
  const existing = document.querySelector('.toast[data-lock]');
  if (existing) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('data-lock', '');
  toast.innerHTML = `
    <div>
      <div class="toast__title">The Letter is sealed</div>
      <span class="toast__sub">Collect all 7 stamps to unlock</span>
    </div>
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 2400);
}

/* Progress strip: only visible on gallery pages */
function initNavProgress() {
  const strip = document.querySelector('[data-progress]');
  if (!strip) return;
  const currentId = getCurrentPage();
  const match = currentId.match(/^gallery(\d)$/);
  if (!match) { strip.hidden = true; return; }

  strip.hidden = false;
  const num = match[1];
  const currentEl = strip.querySelector('#navProgressCurrent');
  if (currentEl) currentEl.textContent = num.padStart(2, '0');

  const dotsEl = strip.querySelector('#navProgressDots');
  if (!dotsEl) return;
  const completed = completedGalleryIds();
  dotsEl.innerHTML = GALLERY_ITEMS.map((g, i) => {
    const isCurrent = g.id === currentId;
    const isComplete = completed.includes(g.gallery);
    const state = isCurrent ? 'current' : isComplete ? 'complete' : 'pending';
    return `<a href="${g.href}" class="nav-progress__dot is-${state}" title="${g.label}" aria-label="${g.label}"></a>`;
  }).join('');
}

/* Galleries dropdown open/close */
function initDropdown() {
  const trigger = document.querySelector('.nav-dropdown__trigger');
  const dropdown = document.querySelector('.nav-dropdown');
  if (!trigger || !dropdown) return;

  const close = () => {
    dropdown.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    dropdown.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.contains('is-open') ? close() : open();
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* Mobile hamburger drawer */
function initHamburger() {
  const btn = document.querySelector('.nav-hamburger');
  const drawer = document.querySelector('.mobile-drawer');
  if (!btn || !drawer) return;

  const list = drawer.querySelector('.mobile-drawer__list');
  const currentId = getCurrentPage();
  const completed = completedGalleryIds();
  const letterUnlocked = completed.length >= 7;

  list.innerHTML = NAV_ORDER.map((n) => {
    const isCurrent = n.id === currentId;
    const isGallery = !!n.gallery;
    const isComplete = isGallery && completed.includes(n.gallery);
    const isLetter = n.id === 'letter';
    const isLocked = isLetter && !letterUnlocked;
    const cls = [
      'mobile-drawer__link',
      isCurrent ? 'is-current' : '',
      isComplete ? 'is-complete' : '',
      isLocked ? 'is-locked' : '',
    ].filter(Boolean).join(' ');
    const suffix = isComplete ? '<span class="mobile-drawer__mark">✓</span>'
                  : isLocked  ? '<span class="mobile-drawer__mark">✦</span>'
                  : isCurrent ? '<span class="mobile-drawer__mark mobile-drawer__mark--current">●</span>'
                  : '';
    return `<li><a class="${cls}" href="${n.href}">${n.label} ${suffix}</a></li>`;
  }).join('');

  const close = () => {
    document.body.classList.remove('nav-drawer-open');
    btn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
  };
  const open = () => {
    document.body.classList.add('nav-drawer-open');
    btn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
  };

  btn.addEventListener('click', () => {
    document.body.classList.contains('nav-drawer-open') ? close() : open();
  });
  drawer.querySelector('.mobile-drawer__close')?.addEventListener('click', close);
  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) close();
    if (e.target.closest('.is-locked')) {
      e.preventDefault();
      showLockToast();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  injectChrome();
  buildGalleryDropdown();
  highlightCurrentNav();
  setPrevNext();
  initNavProgress();
  initDropdown();
  initHamburger();
  updateLetterLock();
  initSmoothScroll();
  initCursor();
  initSpotifyPlayer();
  initTransitions();
  if (typeof Stamps !== 'undefined') Stamps.paintCounter();
  if (typeof Animation !== 'undefined') Animation.observe();
});
