# Indigo Museum

**A fanmade virtual birthday exhibition for Kim Namjoon (RM of BTS).**
Seven galleries, a stamp-collection tour, a shared Firestore guestbook, and a
birthday letter unlocked at the end. Built as a static site — deployable
directly to GitHub Pages.

> This is an unofficial fanmade birthday project created by ARMY.
> It is not affiliated with BIGHIT MUSIC, HYBE, or BTS.

---

## Stack

| Layer            | Tool                                         |
| ---------------- | -------------------------------------------- |
| Markup / styling | HTML5 · CSS3 (no Tailwind)                   |
| Interactivity    | Vanilla JavaScript (ES6, ES modules)         |
| Animation        | [GSAP](https://gsap.com) + ScrollTrigger     |
| Smooth scroll    | [Lenis](https://github.com/darkroomengineering/lenis) |
| Backend (guestbook only) | Firebase Firestore Web SDK v11 Modular |

No build step. No framework. Ships as-is.

---

## Structure

```
/
├── index.html                 Landing (hero + Begin Exhibition)
├── lobby.html                 Museum lobby
├── gallery1.html … gallery7.html
├── stickers.html              Sticker collection & downloads
├── letter.html                Birthday letter (unlocked after 7 stamps)
│
├── css/
│   ├── style.css              Design system, cursor, chrome, layout
│   ├── animations.css         Keyframes and reveal utilities
│   └── responsive.css         Tablet + mobile
│
├── js/
│   ├── app.js                 Boot: Lenis, cursor, music, transitions, chrome
│   ├── animation.js           GSAP helpers + IntersectionObserver reveals
│   ├── gallery.js             Gallery-page helpers (exit → award → next)
│   ├── stamps.js              Stamp collection (localStorage + ink animation)
│   ├── ticket.js              Museum Ticket modal
│   ├── guestbook.js           Firestore form + live wall (Gallery 07)
│   └── firebase.js            Firebase v11 modular init
│
├── assets/
│   ├── images/                (drop your images here — see checklist below)
│   ├── audio/                 (drop your audio files here — see checklist below)
│   ├── icons/                 (7 stamp icons ship inline as SVG in stamps.js)
│   └── fonts/                 (fonts load via Google Fonts CDN)
│
├── firestore.rules            Deploy with the Firebase CLI
└── README.md
```

---

## Firebase setup (for the guestbook)

The rest of the site is fully static. Only the guestbook needs a backend.

1. Create a free Firebase project at <https://console.firebase.google.com>.
2. In **Build → Firestore Database**, create a database in *production* mode
   (the shipped rules restrict writes to valid messages only).
3. In **Project settings → General → Your apps**, add a Web app and copy the
   `firebaseConfig` object.
4. Open `js/firebase.js` and replace the `REPLACE_ME` placeholder values with
   your real config.
5. Deploy the security rules:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # select your project; keep firestore.rules
   firebase deploy --only firestore:rules
   ```

That's it — the wall on `gallery7.html` will now stream messages live.

The Firestore config values are **public by design** for browser SDKs; the
security perimeter is `firestore.rules`, not the config. Do not paste API keys
of any project you want kept private into a public GitHub repo.

### Data model

Firestore collection: `guestbook`

| Field       | Type       | Notes                                 |
| ----------- | ---------- | ------------------------------------- |
| `name`      | string?    | Optional. Max 40 chars.               |
| `country`   | string?    | Optional. Max 30 chars.               |
| `message`   | string     | Required. 1–300 chars.                |
| `createdAt` | timestamp  | Server timestamp, set by client SDK.  |

Client enforces:
- HTML escape (`textContent`) — no XSS possible on the wall.
- 300-character limit.
- Empty-message block.
- 30-second per-browser cooldown via `localStorage`.
- Success → "Archived" ink-stamp animation.

Rules enforce:
- Read = public.
- Create = valid schema, valid length, server-set timestamp.
- Update/Delete = denied.

### Troubleshooting

| Symptom on `gallery7.html` | Likely cause | Fix |
| --- | --- | --- |
| `"…(permission-denied)…"` | `firestore.rules` was never deployed to the Firebase project | Firebase Console → Firestore Database → **Rules** tab → paste this repo's `firestore.rules` → **Publish**. Or run `firebase deploy --only firestore:rules`. |
| `"…(unavailable)…"` or `"…(failed-precondition)…"` | Firestore Database has not been created for this project | Firebase Console → **Build → Firestore Database → Create database**. Choose a location (e.g. `nam5`). |
| `"Loading messages…"` forever, no console error | Site is being served via `file://` — Firebase modular SDK requires `http(s)://` | Run `python3 -m http.server 8000` and open `http://localhost:8000`. |
| Wall loads fine but submit fails with `permission-denied` | Rules allow read but block create (rules mismatch this repo's schema) | Confirm the rules in Console match this repo's `firestore.rules` exactly. |

---

## Assets checklist (drop in `assets/`)

The site works out of the box with placeholder SVGs and silent audio elements.
For the polished experience, drop in the following:

### Images (`assets/images/`)

| File                          | Used on                | Suggested size |
| ----------------------------- | ---------------------- | -------------- |
| `hero-entrance.jpg`           | Landing hero background (fallback: gradient) | 2400×1600 |
| `lobby-bg.jpg` *(optional)*   | Lobby background       | 2400×1600      |
| `g1-childhood.jpg`, `g1-notebook.jpg`, `g1-mic.jpg` | Gallery 01 chapters | 900×1200 each |
| `stickers/sticker-01.png` … `sticker-12.png` | Stickers page | 1024×1024 each, transparent PNG |

Missing images are gracefully hidden or replaced with SVG placeholders.

### Audio (`assets/audio/`)

| File            | Used for                              | Suggested length |
| --------------- | ------------------------------------- | ---------------- |
| `piano.mp3`     | Ambient background loop               | 2–5 min, loopable |
| `door.mp3`      | Entrance transition on landing        | 1–3 s            |
| `stamp.mp3`     | Stamp award animation                 | 0.4–1 s          |
| `ambience.mp3`  | Optional additional ambient sound     | 2–5 min, loopable |

Missing audio files fail silently — the Music On/Off toggle still works and
persists in `localStorage`.

Suggested royalty-free sources:
- <https://pixabay.com/music/> (search "soft piano ambient")
- <https://freesound.org/> (CC0-licensed sound effects)

---

## Local development

Firebase modular SDK does not work over `file://`. Serve locally with any
static server:

```bash
python3 -m http.server 8000
# → open http://localhost:8000
```

Or:

```bash
npx serve .
```

---

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In **Settings → Pages**, set source = `main` branch, folder = `/ (root)`.
3. Visit `https://<user>.github.io/<repo>/` — the site works on subpaths
   because all internal links are relative.

---

## Customizing

- **Content** for each gallery lives in that gallery's HTML file directly.
- **Books & quotes** for Gallery 02 are in the `BOOKS` array in `gallery2.html`.
- **Timeline entries** for Gallery 03 are inline in `gallery3.html`.
- **Collection objects** for Gallery 04 are in the `OBJECTS` array in `gallery4.html`.
- **Sticker count** in `stickers.html` — change the `length: 12` in the `Array.from` call.
- **Letter text** is at the bottom of `letter.html`.
- **Colors, type, spacing** — CSS custom properties at the top of `css/style.css`.

---

## Disclaimer

This is an unofficial fanmade birthday exhibition created by ARMY.
It is not affiliated with BIGHIT MUSIC, HYBE, or BTS.
No HYBE / BIGHIT logos or protected branding are used.
Album titles and public quotes are referenced editorially, without full
copyrighted lyrics.

Dedicated to Kim Namjoon · 12 September.

With love, from ARMY.
