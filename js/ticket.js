/* ==========================================================================
   INDIGO MUSEUM — ticket.js
   Museum Ticket modal: slide in → QR scan → VISITED stamp → auto-close
   ========================================================================== */

const Ticket = (() => {
  const KEY = 'rkive_ticket_seen';

  function markup() {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
    const no = 'RM-' + String(Math.floor(Math.random() * 900000) + 100000);
    return `
      <div class="ticket" role="dialog" aria-label="Museum Ticket">
        <div class="ticket__stamp">VISITED</div>
        <div class="ticket__left">
          <div class="ticket__label">Indigo Museum</div>
          <div class="ticket__title">A Birthday Exhibition</div>
          <div class="ticket__label" style="margin-top:0.4rem;">Kim Namjoon · 12 September</div>
          <div class="ticket__meta">
            <div>
              <strong>Date</strong>
              ${dateStr}
            </div>
            <div>
              <strong>Admit</strong>
              One Visitor
            </div>
            <div>
              <strong>Section</strong>
              All Galleries
            </div>
            <div>
              <strong>Seat</strong>
              Anywhere
            </div>
          </div>
        </div>
        <div class="ticket__right">
          <div class="ticket__qr"><span class="ticket__qr-scan"></span></div>
          <div class="ticket__no">No. ${no}</div>
        </div>
      </div>
    `;
  }

  function open(auto = false) {
    if (auto && localStorage.getItem(KEY)) return;

    const modal = document.createElement('div');
    modal.className = 'modal open';
    modal.innerHTML = `
      <div class="modal__panel" style="max-width:560px; background:transparent; border:none; padding:2rem;">
        <button class="modal__close" aria-label="Close ticket">×</button>
        <div class="eyebrow center" style="margin-bottom:1.4rem;">Your Ticket</div>
        ${markup()}
        <p class="center" style="color:var(--warm-gray); margin-top:1.4rem; font-size:0.75rem; letter-spacing:0.24em; text-transform:uppercase;">Please keep this ticket during your visit.</p>
      </div>
    `;
    document.body.appendChild(modal);

    const ticket = modal.querySelector('.ticket');
    requestAnimationFrame(() => ticket.classList.add('active'));

    // Trigger stamp animation ~2.1s after slide-in
    setTimeout(() => ticket.classList.add('stamped'), 2100);

    localStorage.setItem(KEY, '1');

    const close = () => {
      modal.style.transition = 'opacity 0.4s ease';
      modal.style.opacity = 0;
      setTimeout(() => modal.remove(), 400);
    };
    modal.querySelector('.modal__close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    // Auto-close on first visit
    if (auto) setTimeout(close, 4200);
  }

  return { open };
})();

window.Ticket = Ticket;
