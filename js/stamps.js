/* ==========================================================================
   INDIGO MUSEUM — stamps.js
   Stamp collection persisted in localStorage + ink-stamp animation
   ========================================================================== */

const Stamps = (() => {
  const KEY = 'rkive_stamps';
  const IDS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'];

  const META = {
    g1: { num: '01', title: 'The Beginning',      icon: 'microphone' },
    g2: { num: '02', title: 'Words That Shaped Me', icon: 'book' },
    g3: { num: '03', title: 'Beyond The Stage',   icon: 'piano' },
    g4: { num: '04', title: 'The Collection',     icon: 'books' },
    g5: { num: '05', title: 'Music Of My Life',   icon: 'headphones' },
    g6: { num: '06', title: 'Reflection Room',    icon: 'window' },
    g7: { num: '07', title: 'To Namjoon',         icon: 'letter' },
  };

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function set(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
  function has(id) { return get().includes(id); }
  function count() { return get().length; }
  function allCollected() { return IDS.every((id) => has(id)); }

  function award(id) {
    if (!IDS.includes(id) || has(id)) { paintCounter(); return false; }
    const list = get();
    list.push(id);
    set(list);
    paintCounter();
    showToast(id);
    return true;
  }

  function paintCounter() {
    const c = document.getElementById('stampCount');
    const pill = document.getElementById('stampPill');
    if (c) c.textContent = `${count()}/7`;
    if (pill && allCollected()) {
      pill.classList.add('stamp-pill--complete');
      pill.setAttribute('href', 'letter.html');
      const label = pill.querySelector('#stampCount');
      if (label) label.textContent = 'Open Letter';
    }

    // Repaint stamp grid on lobby
    document.querySelectorAll('.stamp-slot').forEach((slot) => {
      const id = slot.dataset.stampId;
      if (has(id)) slot.classList.add('stamp-slot--collected');
    });
  }

  /* Toast for collected stamp */
  function showToast(id) {
    const meta = META[id];
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast__icon">${iconSVG(meta.icon)}</div>
      <div>
        <div class="toast__title">Stamp Collected!</div>
        <span class="toast__sub">${meta.num} · ${meta.title}</span>
      </div>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 600);
    }, 2800);
  }

  /* Full-screen ink stamp animation (called on gallery exit) */
  function playInkStamp(id, onDone) {
    const meta = META[id];
    const overlay = document.createElement('div');
    overlay.className = 'modal open';
    overlay.style.background = 'rgba(245,240,232,0.94)';
    overlay.innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <div class="eyebrow" style="margin-bottom:1.6rem;">Stamp Awarded</div>
        <div style="position:relative; display:inline-block; padding: 2rem;">
          <div class="ink-stamp-mark" style="
            width: 160px; height: 160px;
            border: 4px solid var(--stamp-red);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: var(--stamp-red);
            transform: scale(1.8) rotate(-14deg);
            opacity: 0;
          ">
            ${iconSVG(meta.icon, 80)}
          </div>
        </div>
        <h2 style="font-family:var(--font-serif); font-size:2rem; margin-top:1.4rem; color:var(--navy);">${meta.title}</h2>
        <p style="color:var(--warm-gray); margin: 0.6rem auto 2rem;">Stamp ${meta.num} added to your collection.</p>
        <div class="eyebrow" style="opacity:0.7;">Continuing to next gallery…</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const mark = overlay.querySelector('.ink-stamp-mark');
    if (typeof gsap !== 'undefined') {
      gsap.to(mark, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: 'back.out(2)',
      });
    } else {
      mark.style.transition = 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      requestAnimationFrame(() => {
        mark.style.opacity = 1;
        mark.style.transform = 'scale(1) rotate(0)';
      });
    }

    // Play audio if available
    try {
      const a = new Audio('assets/audio/stamp.mp3');
      a.volume = 0.4;
      a.play().catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      overlay.style.transition = 'opacity 0.5s ease';
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.remove();
        if (onDone) onDone();
      }, 500);
    }, 2000);
  }

  /* Small inline SVG icons for stamps */
  function iconSVG(name, size = 40) {
    const s = `width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    const svgs = {
      microphone: `<svg ${s}><rect x="26" y="8" width="12" height="30" rx="6"/><path d="M18 30v4a14 14 0 0 0 28 0v-4"/><path d="M32 48v10"/><path d="M22 58h20"/></svg>`,
      book:       `<svg ${s}><path d="M12 12h32v40H12z"/><path d="M20 12v40"/><path d="M20 22h20M20 30h20M20 38h14"/></svg>`,
      piano:      `<svg ${s}><rect x="8" y="18" width="48" height="28"/><path d="M16 18v20M24 18v20M32 18v20M40 18v20M48 18v20"/><path d="M20 34h4v12h-4zM28 34h4v12h-4zM36 34h4v12h-4zM44 34h4v12h-4z" fill="currentColor" stroke="none"/></svg>`,
      books:      `<svg ${s}><path d="M12 52V16h6v36zM20 52V12h6v40zM28 52V18h6v34zM36 52V14l6 2v36zM44 52l4-32 6 2-4 32z"/></svg>`,
      headphones: `<svg ${s}><path d="M10 36v-4a22 22 0 0 1 44 0v4"/><path d="M10 36v10a4 4 0 0 0 4 4h4v-18h-4a4 4 0 0 0-4 4z"/><path d="M54 36v10a4 4 0 0 1-4 4h-4V32h4a4 4 0 0 1 4 4z"/></svg>`,
      window:     `<svg ${s}><rect x="10" y="10" width="44" height="44"/><path d="M32 10v44M10 32h44"/><path d="M18 22l4 4M18 26l4-4"/></svg>`,
      letter:     `<svg ${s}><rect x="8" y="14" width="48" height="36" rx="2"/><path d="M8 18l24 18 24-18"/><path d="M8 46l16-14M56 46L40 32"/></svg>`,
    };
    return svgs[name] || svgs.book;
  }

  return {
    IDS,
    META,
    get,
    has,
    count,
    allCollected,
    award,
    paintCounter,
    playInkStamp,
    iconSVG,
  };
})();

window.Stamps = Stamps;
