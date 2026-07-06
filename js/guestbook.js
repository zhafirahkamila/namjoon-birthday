/* ==========================================================================
   INDIGO MUSEUM — guestbook.js  (Gallery 07)
   Firestore-backed guestbook: real-time onSnapshot render,
   30s cooldown, 300 char limit, XSS-safe rendering, "Archived" ink stamp.
   ========================================================================== */

import {
  db,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from './firebase.js';

const COOLDOWN_KEY = 'rkive_last_post';
const COOLDOWN_MS  = 30_000;
const MAX_CHARS    = 300;

/* Cache flag emojis for common country names/codes */
function flagFor(input) {
  if (!input) return '';
  const raw = String(input).trim().toUpperCase();
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw)) {
    return String.fromCodePoint(...[...raw].map((c) => 0x1F1A5 + c.charCodeAt(0)));
  }
  return '';
}

function relativeTime(ts) {
  if (!ts) return '';
  const then = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - then.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  const days = Math.floor(diff / 86400);
  if (days < 30) return days + 'd ago';
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* Safe text node builder — never uses innerHTML for user content */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderMessages(docs) {
  const wall = document.getElementById('guestbookWall');
  if (!wall) return;
  wall.textContent = '';

  if (!docs.length) {
    const empty = el('p', 'center', 'Be the first to leave a birthday wish.');
    empty.style.color = 'var(--warm-gray)';
    empty.style.fontStyle = 'italic';
    empty.style.fontFamily = 'var(--font-serif)';
    wall.appendChild(empty);
    return;
  }

  docs.forEach((d) => {
    const data = d.data();
    const card = el('article', 'guestbook__card');
    const bq   = el('blockquote', null, data.message || '');
    card.appendChild(bq);

    const meta = el('div', 'guestbook__meta-line');
    const left = el('span', null, [data.name || 'Anonymous', flagFor(data.country)].filter(Boolean).join(' · '));
    const right = el('span', null, relativeTime(data.createdAt));
    meta.appendChild(left);
    meta.appendChild(right);
    card.appendChild(meta);
    wall.appendChild(card);
  });
}

function setNotice(msg, ok = false) {
  const n = document.getElementById('guestbookNotice');
  if (!n) return;
  n.textContent = msg;
  n.classList.toggle('ok', ok);
}

function playArchivedStamp(form) {
  const s = form.querySelector('.archived-stamp');
  if (!s) return;
  s.classList.remove('stamp');
  void s.offsetWidth;
  s.classList.add('stamp');
}

function cooldownRemaining() {
  const t = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
  const elapsed = Date.now() - t;
  return Math.max(0, COOLDOWN_MS - elapsed);
}

async function submit(e) {
  e.preventDefault();
  const form    = e.currentTarget;
  const name    = form.name.value.trim().slice(0, 40);
  const country = form.country.value.trim().slice(0, 30);
  const message = form.message.value.trim();

  if (!message) { setNotice('Please write a message.'); return; }
  if (message.length > MAX_CHARS) { setNotice(`Please keep messages under ${MAX_CHARS} characters.`); return; }

  const remaining = cooldownRemaining();
  if (remaining > 0) {
    setNotice(`Please wait ${Math.ceil(remaining/1000)}s before posting again.`);
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    await addDoc(collection(db, 'guestbook'), {
      name: name || null,
      country: country || null,
      message,
      createdAt: serverTimestamp(),
    });
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    playArchivedStamp(form);
    setNotice('Message archived. Thank you for visiting.', true);
    form.message.value = '';
    updateCharCount(form);
  } catch (err) {
    console.error('[guestbook] submit failed', err);
    setNotice('Could not send — check your connection and try again.');
  } finally {
    setTimeout(() => { submitBtn.disabled = false; }, 800);
  }
}

function updateCharCount(form) {
  const counter = form.querySelector('.js-char-count');
  if (!counter) return;
  const len = form.message.value.length;
  counter.textContent = `${len}/${MAX_CHARS}`;
  counter.style.color = len > MAX_CHARS ? 'var(--stamp-red)' : 'var(--warm-gray)';
}

export function init() {
  const form = document.getElementById('guestbookForm');
  if (!form) return;

  form.message.setAttribute('maxlength', MAX_CHARS);
  form.addEventListener('submit', submit);
  form.message.addEventListener('input', () => updateCharCount(form));
  updateCharCount(form);

  // Live subscription
  const q = query(collection(db, 'guestbook'), orderBy('createdAt', 'desc'), limit(200));
  onSnapshot(q, (snap) => renderMessages(snap.docs),
    (err) => {
      console.error('[guestbook] subscription error', err);
      const wall = document.getElementById('guestbookWall');
      if (!wall) return;
      wall.textContent = '';
      const p = document.createElement('p');
      p.className = 'center';
      p.style.color = 'var(--warm-gray)';
      p.style.fontFamily = 'var(--font-serif)';
      p.style.fontStyle = 'italic';
      const hint = err.code === 'permission-denied'
        ? 'Firestore rules need to be deployed. See README → Firebase setup, step 5.'
        : (err.code === 'unavailable' || err.code === 'failed-precondition')
          ? 'Firestore Database has not been created for this project. See README → Firebase setup.'
          : 'Please check your connection or try again shortly.';
      p.textContent = `Guestbook is temporarily unavailable (${err.code || 'unknown'}). ${hint}`;
      wall.appendChild(p);
    });
}

// Auto-init if page is Gallery 7
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('guestbookForm')) init();
});
