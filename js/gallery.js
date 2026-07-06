/* ==========================================================================
   INDIGO MUSEUM — gallery.js
   Shared logic for gallery pages: chapter reveals, dust particles,
   progress bar, exit CTA that awards stamp then routes to next.
   ========================================================================== */

const Gallery = (() => {
  function initExit(currentId, nextHref) {
    const btn = document.getElementById('galleryExitBtn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Stamps.award(currentId);
      Stamps.playInkStamp(currentId, () => {
        window.location.href = nextHref;
      });
    });
  }

  function initProgress() {
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = p + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initHero(container) {
    if (typeof Animation !== 'undefined') {
      Animation.dust(container, 22);
    }
  }

  return { initExit, initProgress, initHero };
})();

window.Gallery = Gallery;

document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.gallery-intro');
  if (hero) Gallery.initHero(hero);
  if (document.querySelector('main[data-gallery]')) Gallery.initProgress();
});
