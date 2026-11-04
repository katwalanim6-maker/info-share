# ANIM OS 2.0

**Your world. Your system.**

ANIM OS is a mobile-first personal operating environment concept, built with lightweight HTML, CSS and JavaScript and packaged as an Android app.

## Install on Android

The Android APK is built automatically by GitHub Actions.

1. Open the repository's **Actions** tab.
2. Open the latest successful **Build ANIM OS Android APK** run.
3. Download the **ANIM-OS-debug-APK** artifact.
4. Extract \`app-debug.apk\` and install it on your Android device.

You can also install the web experience from Chrome using **Install app** / **Add to Home screen**. The web/PWA experience and the native Android APK have different capabilities: the native APK includes the local NOVA assistant.

## NOVA — personal AI

The Android app includes a native NOVA chat screen powered by LiteRT-LM.

- Choose a compatible \`.litertlm\` model from your phone.
- The app copies the model into private app storage.
- Text inference runs on-device using the CPU backend.
- A short conversation transcript is stored locally.
- The model file is intentionally not included in the APK or repository.

The first model load can take some time and requires enough free device storage and memory for the selected model.

## Project structure

- \`index.html\` — application shell and home screen
- \`style.css\` — responsive dark interface and mobile navigation
- \`script.js\` — home screen interactions and NOVA Android bridge
- \`cloudscape.js\` — animated procedural cloudscape
- \`manifest.webmanifest\` — install metadata and launcher icons
- \`sw.js\` — offline app-shell cache and update handling
- \`offline.html\` — offline fallback page
- \`android/\` — native Android APK and NOVA integration
- \`assets/brand/\` — ANIM OS logo
- \`assets/icons/\` — app and maskable icons
- \`assets/identity/\` — preserved identity artwork

## Preview

Open the GitHub Pages deployment or serve this folder with any static web server. PWA installation requires HTTPS (GitHub Pages provides HTTPS).

## Status

ANIM OS 2.0 prototype with the first native NOVA integration.

## License

See [LICENSE](LICENSE).
