# ANIM OS 2.0 — Architecture Blueprint

**Status:** Proposed target architecture  
**Repository:** `katwalanim6-maker/info-share`  
**Scope:** Architecture milestone only; this document does not change runtime behavior.

## 1. Product definition

ANIM OS is a mobile-first personal digital environment delivered as:
- an installable web/PWA experience;
- an Android application that adds native capabilities and local NOVA intelligence.

It is an application environment, not a replacement Android operating system. Android remains responsible for device security, permissions, lifecycle, and system services.

## 2. Current repository baseline

The current repository contains:
- `index.html`, `style.css`, and `script.js`: the mobile-first web home screen and interactions;
- `cloudscape.js`: procedural, three-plane canvas cloud rendering;
- `manifest.webmanifest`, `sw.js`, and `offline.html`: PWA installation and app-shell caching;
- `android/app`: an Android wrapper and native NOVA screen;
- GitHub Actions workflows for Pages deployment and debug APK generation;
- identity, logo, and launcher assets under `assets/`.

Current Android configuration observed:
- application ID / namespace: `com.anim.os`;
- minimum SDK 24, compile SDK 35, target SDK 35;
- Android Gradle Plugin 8.7.3, Kotlin Android plugin 2.3.21;
- LiteRT-LM Android dependency 0.18.0;
- Java 17 build workflow using Gradle 8.9.

Current runtime behavior:
- `MainActivity` hosts a WebView that loads the public GitHub Pages URL, enables JavaScript and DOM storage, and exposes `AnimOSBridge.openNova()`;
- `NovaActivity` owns its chat UI, model import, LiteRT-LM CPU engine, inference worker, and conversation history;
- NOVA copies the selected model into app-private files and stores a bounded transcript in SharedPreferences;
- the web app's app tiles, profile, settings, and several navigation destinations currently display placeholder notices rather than opening working features;
- the PWA service worker caches the web app shell, but the Android WebView currently depends on the remote Pages URL for its initial UI load.

## 3. Architecture decisions

### Decision A — Keep one shared visual frontend

Keep the existing HTML/CSS/JavaScript frontend as the shared presentation layer for the PWA and Android home experience during the first architecture phase. Do not rewrite the existing visual design or cloud renderer as part of the architecture setup.

For Android, progressively package the same frontend files inside the APK and serve them locally through AndroidX WebKit's WebViewAssetLoader. The PWA continues to use the hosted version. This removes the Android home screen's dependency on a live network connection while avoiding two independently maintained home UIs.

### Decision B — Native Android owns privileged capabilities

The Android layer owns capabilities that require Android APIs:
- NOVA's on-device model runtime and model-file management;
- notifications, share intents, and approved device integrations when added;
- permission prompts and lifecycle-aware platform services;
- local persistence and optional network access.

The web frontend must not directly access arbitrary Android APIs. It may request only documented, narrow operations through a versioned bridge.

### Decision C — Local-first data ownership

The device is the initial source of truth. Do not introduce a required account, cloud database, or mandatory network service for the first release.

Use:
- DataStore (or the existing preferences temporarily) for small settings and preferences;
- Room when structured records such as app data, notes, tasks, or richer conversation history are introduced;
- app-private files for imported local AI model files;
- repositories as the only interface between UI/features and their data sources.

Cloud sync can be added later as an optional capability with explicit conflict and privacy rules. It must not silently replace local data ownership.

### Decision D — NOVA is a feature, not the whole application

Keep the NOVA experience independent from the home-screen UI. Separate:
- chat presentation and UI state;
- conversation/history repository;
- model-file repository and import validation;
- an AI runtime interface;
- the LiteRT-LM implementation of that interface.

This allows a future online model provider to be added behind the same interface without coupling the UI to a specific model vendor. The current CPU-based local implementation remains the first provider.

### Decision E — Explicit and restricted WebView bridge

Replace the broad JavaScript interface over time with an origin-restricted message bridge (AndroidX WebKit WebMessageListener where supported, with a safe fallback if needed). Load only trusted local app content in the Android WebView. Define a small allow-list of operations, validate every input, return structured results, and never expose arbitrary command execution, filesystem paths, or unrestricted device control.

## 4. Target logical architecture

```text
ANIM OS 2.0
|
+-- Presentation
|   +-- Shared Web UI: Home, Explore, Apps, Profile, Settings
|   +-- NOVA chat UI
|   +-- UI state and navigation
|
+-- Feature / Domain
|   +-- App catalog and launch rules
|   +-- Profile and preferences
|   +-- NOVA conversation use cases
|   +-- Approved device-action use cases
|
+-- Data
|   +-- Repositories (single source of truth)
|   +-- Local settings store
|   +-- Local database (when structured data is needed)
|   +-- Model and attachment file storage
|   +-- Optional remote sync (future, non-required)
|
+-- Platform / Runtime
    +-- Android host and lifecycle
    +-- Secure WebView bridge
    +-- Android system integrations
    +-- AI runtime interface
        +-- LiteRT-LM local provider (current)
        +-- Remote provider (future, optional)
```

The PWA uses the shared Presentation layer and browser-supported storage/capabilities. Android-specific capabilities are unavailable in PWA mode and must be shown as unavailable rather than simulated as successful.

## 5. Proposed repository evolution

Do not create every package or module immediately. Introduce boundaries incrementally, beginning with packages inside the existing Android app:

```text
android/app/src/main/
  java/com/anim/os/
    app/                 # Application wiring and navigation
    core/
      bridge/            # Web-to-native message contract
      data/              # Shared repository contracts/helpers
      storage/           # Settings and local persistence
    feature/
      home/              # Home screen coordination
      apps/              # App catalog and launch behavior
      profile/           # Owner profile
      settings/          # Preferences and permissions
      nova/
        ui/              # NOVA presentation
        domain/          # Conversation and model use cases
        data/            # History/model repositories
        runtime/         # LiteRT-LM adapter
    platform/
      android/           # Android-specific adapters
  assets/
    web/                 # Shared frontend files packaged for WebView
```

Keep the existing Java `MainActivity` and Kotlin `NovaActivity` working while extracting responsibilities. A single-activity navigation migration can be considered after the UI and data boundaries are stable; it is not a prerequisite for this milestone.

## 6. Security, privacy, and reliability rules

1. Ask for Android permissions only when a user starts a feature that needs them.
2. Keep model files and private conversation data in app-private storage.
3. Do not upload prompts, transcripts, or files unless the user explicitly enables a feature that requires it.
4. Do not treat text from the WebView as trusted commands.
5. Validate bridge message origin, operation name, payload shape, and authorization.
6. Keep long-running inference and file operations off the main thread.
7. Persist important state outside Activity instances so it survives process recreation.
8. Make offline and unavailable states explicit in both PWA and Android experiences.

## 7. Architecture gaps found in the current implementation

| Area | Current state | Target |
|---|---|---|
| Android home loading | WebView loads remote Pages URL | Bundle shared UI locally in APK |
| Web/native boundary | JavaScript interface exposes `openNova` | Versioned, origin-restricted allow-list |
| Screen navigation | Home is Web UI; NOVA is a separate Activity | Clear navigation contract and feature boundaries |
| NOVA logic | UI, engine lifecycle, model import, and history are in one Activity | UI + use cases + repositories + runtime adapter |
| Conversation storage | Bounded JSON in SharedPreferences | Repository; Room when richer history is required |
| App tiles and tabs | Several destinations are placeholders | App catalog and real feature destinations |
| Offline behavior | PWA shell caching; Android UI depends on network | Local Android UI assets plus PWA cache |
| Cloud rendering | Three canvases are rendered synchronously on the UI thread | Measure startup cost; optimize only after baseline profiling |

## 8. Delivery sequence

### Phase 0 — Architecture baseline (this document)
- Record the existing runtime and dependencies.
- Agree on the shared-frontend / native-capabilities boundary.
- Avoid changing working screens during design.

### Phase 1 — Stabilize the Android shell
- Bundle the shared web frontend inside the APK.
- Load it locally with WebViewAssetLoader.
- Preserve the PWA Pages deployment.
- Add a small, versioned bridge contract and origin validation.
- Verify online and airplane-mode startup.

### Phase 2 — Separate NOVA responsibilities
- Extract model import and storage.
- Extract conversation history access.
- Define the AI runtime interface and retain LiteRT-LM as the first implementation.
- Preserve current local model compatibility and verify inference after each extraction.

### Phase 3 — Build real OS features
- Add app catalog and navigation state.
- Implement profile and settings with local persistence.
- Add features one by one, each with its own UI state and repository.
- Keep unsupported PWA/native features clearly differentiated.

### Phase 4 — Optional connected services
- Add remote services only when a feature requires them.
- Keep local operation available when disconnected.
- Add explicit sync, conflict handling, and privacy controls before cloud data becomes authoritative.

## 9. Acceptance criteria for the architecture milestone

- [ ] Existing PWA home screen and cloud visuals remain intact.
- [ ] Android home screen can load without fetching the GitHub Pages site.
- [ ] NOVA can still import and load a compatible local model.
- [ ] NOVA conversation history survives closing and reopening the app.
- [ ] The web/native bridge exposes only documented operations.
- [ ] No cloud account or backend is required for core home and NOVA usage.
- [ ] Existing APK and Pages workflows remain independently buildable/deployable.

## 10. Scope guardrails

This milestone is architecture and safe boundary definition, not a full rewrite. Do not migrate to Compose, add a backend, add broad device permissions, or replace the cloud renderer until a concrete feature justifies that work and the current behavior is covered by tests.
