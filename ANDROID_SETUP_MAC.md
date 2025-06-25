# Android Development Setup for AudioBookshelf on macOS

This guide will help you set up Android development environment on your Mac for the AudioBookshelf mobile app.

## Prerequisites

### 1. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js v20
```bash
# Using Homebrew
brew install node@20

# Or using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 3. Install Git
```bash
brew install git
```

## Android Development Environment

### 1. Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Open the downloaded `.dmg` file
3. Drag Android Studio to your Applications folder
4. Launch Android Studio and follow the setup wizard

### 2. Configure Android Studio

During first launch, Android Studio will guide you through:
1. **Standard Installation** - Choose this option
2. **SDK Components Setup** - Accept the default selections
3. Let it download and install the required components

### 3. Install Required SDK Components

1. Open Android Studio
2. Go to **Android Studio → Preferences** (or **Settings**)
3. Navigate to **Appearance & Behavior → System Settings → Android SDK**
4. In the **SDK Platforms** tab, install:
   - Android 15 (API Level 35)
   - Android 7.0 (API Level 24) - for minimum SDK support
5. In the **SDK Tools** tab, ensure these are installed:
   - Android SDK Build-Tools 35
   - Android SDK Platform-Tools
   - Android Emulator
   - Intel x86 Emulator Accelerator (HAXM installer) - for Intel Macs
   - Android SDK Command-line Tools

### 4. Configure Environment Variables

Add the following to your `~/.zshrc` or `~/.bash_profile`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/emulator

# Java (Android Studio's bundled JDK)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

Then reload your shell configuration:
```bash
source ~/.zshrc  # or source ~/.bash_profile
```

### 5. Verify Installation

```bash
# Check Java version (should be 17+)
java -version

# Check Android SDK tools
adb --version
emulator -version
```

## AudioBookshelf Project Setup

### 1. Clone the Repository (if not already done)
```bash
cd ~/
git clone https://github.com/advplyr/audiobookshelf-app.git
cd audiobookshelf-app
```

### 2. Install Dependencies
```bash
# Install Node dependencies
npm install

# Generate the web app
npm run generate
```

### 3. Sync with Capacitor
```bash
# Sync the web app to native platforms
npx cap sync
```

### 4. Open in Android Studio
```bash
npx cap open android
```

## Running the App

### Option 1: Using Android Emulator

1. In Android Studio, create an Android Virtual Device (AVD):
   - Click **Tools → AVD Manager**
   - Click **Create Virtual Device**
   - Choose a device (e.g., Pixel 7)
   - Select system image (API 35 recommended)
   - Finish the setup

2. Run the app:
   - Select your AVD from the device dropdown
   - Click the **Run** button (green play icon)

### Option 2: Using Physical Device

1. Enable Developer Options on your Android device:
   - Go to **Settings → About Phone**
   - Tap **Build Number** 7 times
   
2. Enable USB Debugging:
   - Go to **Settings → Developer Options**
   - Enable **USB Debugging**
   
3. Connect your device via USB
4. Accept the debugging prompt on your device
5. Select your device in Android Studio and click **Run**

## Troubleshooting

### Common Issues

1. **Gradle sync failed**
   ```bash
   # Clean and rebuild
   cd android
   ./gradlew clean
   cd ..
   npx cap sync android
   ```

2. **SDK not found**
   - Ensure `ANDROID_HOME` is set correctly
   - Verify SDK is installed in Android Studio

3. **Build tools version mismatch**
   - Update Android Studio and SDK tools to latest versions
   - Check `android/variables.gradle` for required versions

4. **Emulator not starting on M1/M2 Mac**
   - Ensure you're using ARM64 system images
   - Use Android Studio's Device Manager to create compatible AVDs

### Useful Commands

```bash
# Clean build
npm run clean

# Sync all platforms
npx cap sync

# Run Android build
npx cap run android

# Open Android Studio
npx cap open android

# Check Capacitor configuration
npx cap doctor
```

## Development Workflow

1. Make changes to the Vue.js code in the root directory
2. Run `npm run generate` to build the web app
3. Run `npx cap sync android` to sync changes
4. Run the app from Android Studio or use `npx cap run android`

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Documentation](https://developer.android.com/docs)
- [AudioBookshelf GitHub](https://github.com/advplyr/audiobookshelf-app)

## Notes for AudioBookshelf Development

- The app uses Capacitor for cross-platform development
- Android-specific code is in `android/app/src/main/java/com/audiobookshelf/app/`
- Native plugins are in the `android/app/src/main/java/com/audiobookshelf/app/plugins/` directory
- The minimum Android version supported is 7.0 (API 24)
- ExoPlayer is used for media playback on Android