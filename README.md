# ANIM OS 2.0

**Your world. Your system.**

ANIM OS is a mobile-first personal operating environment concept, built with lightweight HTML, CSS and JavaScript.

## Install on Android

1. Open the deployed site in Chrome.
2. Wait for the app to finish loading once while online.
3. Tap **Install** if the install control appears, or open Chrome's menu and choose **Install app** / **Add to Home screen**.
4. Launch ANIM OS from your home screen.

The app manifest defines its standalone portrait experience and custom ANIM OS icon. A service worker caches the app shell so the interface can reopen offline after its first successful online load.

## Project structure

- `index.html` — application shell and home screen
- `style.css` — responsive dark interface and mobile navigation
- `script.js` — greeting, interactions, install prompt and service-worker registration
- `cloudscape.js` — animated procedural cloudscape
- `manifest.webmanifest` — install metadata and launcher icons
- `sw.js` — offline app-shell cache and update handling
- `offline.html` — offline fallback page
- `assets/brand/` — ANIM OS logo
- `assets/icons/` — app and maskable icons
- `assets/identity/` — preserved identity artwork

## Preview

Open the GitHub Pages deployment or serve this folder with any static web server. PWA installation requires HTTPS (GitHub Pages provides HTTPS).

## Status

Early prototype. Application destinations and NOVA integration are planned for later development.

## License

See [LICENSE](LICENSE).
