/* ==========================================================================
   INDIGO MUSEUM — animation.js
   GSAP-driven reveals, dust particles, ScrollTrigger helpers
   ========================================================================== */

const Animation = (() => {
  const hasGSAP = typeof gsap !== 'undefined';
  if (hasGSAP && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
  const isTablet = () => window.matchMedia('(max-width: 1023px)').matches;

  /* IntersectionObserver-based reveal (works even if GSAP is missing) */
  function observe() {
    const els = document.querySelectorAll('[data-anim]');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* Dust particles in a container */
  function dust(container, count = 26) {
    if (!container) return;
    if (isMobile()) return; // Skip particles entirely on phones
    if (isTablet()) count = Math.max(6, Math.floor(count / 2));
    const layer = document.createElement('div');
    layer.className = 'dust-layer';
    for (let i = 0; i < count; i++) {
      const d = document.createElement('span');
      d.className = 'dust floating';
      d.style.left = Math.random() * 100 + '%';
      d.style.top = 100 + Math.random() * 20 + '%';
      d.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
      d.style.setProperty('--d', (14 + Math.random() * 14) + 's');
      d.style.setProperty('--delay', (-Math.random() * 20) + 's');
      const size = 2 + Math.random() * 3;
      d.style.width = size + 'px';
      d.style.height = size + 'px';
      layer.appendChild(d);
    }
    container.appendChild(layer);
  }

  /* Horizontal scroll (Gallery 3). Only pinned/scrubbed on desktop —
     tablet & mobile fall back to native horizontal overflow so wheel+Shift,
     trackpad gestures, native scrollbar, and touch swipe all just work. */
  function horizontalScroll(sectionSel, trackSel) {
    if (!hasGSAP || typeof ScrollTrigger === 'undefined') return;
    if (window.matchMedia('(max-width: 1023px)').matches) return;
    const section = document.querySelector(sectionSel);
    const track = document.querySelector(trackSel);
    if (!section || !track) return;
    const distance = () => track.scrollWidth - window.innerWidth + 80;
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 0.6,
        end: () => '+=' + distance(),
        invalidateOnRefresh: true,
      },
    });
  }

  /* Blur + rise reveal via GSAP (fallback: IO handles this) */
  function reveal(sel, opts = {}) {
    if (!hasGSAP) return;
    const els = gsap.utils.toArray(sel);
    els.forEach((el, i) => {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 30, filter: 'blur(8px)' },
        {
          autoAlpha: 1, y: 0, filter: 'blur(0px)',
          duration: 1.4, ease: 'expo.out',
          delay: (opts.stagger || 0.1) * i,
          scrollTrigger: { trigger: el, start: 'top 82%' },
        }
      );
    });
  }

  return { observe, dust, horizontalScroll, reveal };
})();

window.Animation = Animation;
