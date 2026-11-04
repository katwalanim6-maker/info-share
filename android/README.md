# ANIM OS Android APK

This project packages the ANIM OS web experience in a lightweight Android WebView shell.

## Build
The GitHub Actions workflow `.github/workflows/android-apk.yml` builds a debug APK on each push affecting `android/**`, or when manually dispatched.

The APK is uploaded as the workflow artifact named `ANIM-OS-debug-APK`. Download `app-debug.apk` from the successful run's Artifacts section and install it on an Android device. Android may ask you to allow installation from the browser or file manager used to open it.

## App identity
- Application ID: `com.anim.os`
- Display name: ANIM OS
- Orientation: portrait
- Launcher: ANIM OS custom adaptive icon

The app loads the published GitHub Pages site. The site must be deployed and reachable for the live interface to load; the APK itself is a native Android package containing a WebView shell.
