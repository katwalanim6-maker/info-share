# ANIM OS Android APK

ANIM OS is a mobile-first Android shell with a native NOVA offline assistant.

## Build

The GitHub Actions workflow \`.github/workflows/android-apk.yml\` builds a debug APK on each push affecting \`android/**\`, or when manually dispatched.

After a successful run:
1. Open the workflow run in the repository's **Actions** tab.
2. Download the artifact named **ANIM-OS-debug-APK**.
3. Extract \`app-debug.apk\` and install it on your Android device.

## NOVA offline setup

1. Open ANIM OS and tap the **NOVA** card or NOVA tab.
2. Tap **CHOOSE MODEL**.
3. Select a compatible \`.litertlm\` model file already stored on your phone.
4. NOVA copies it into the app's private storage and initializes it locally.
5. Start chatting. The selected model and saved conversation transcript remain on the device.

The model file is not bundled into the APK or committed to this repository. You must provide a compatible model file on the device. The first model load can take some time. NOVA currently uses the LiteRT-LM CPU backend to keep the Android build independent of optional GPU libraries.

## App identity

- Application ID: \`com.anim.os\`
- Display name: ANIM OS
- Orientation: portrait
- Launcher: ANIM OS custom adaptive icon
- Minimum Android version: Android 7.0 (API 24)

## Privacy and capabilities

NOVA's model inference runs locally after the model is installed. Conversation history is stored in the app's private preferences. This first integration does not request microphone, contacts, location, or other device permissions.
