# iOS Playback Resume Fix Test Plan V2

## Issue
When playing an audiobook in the iOS app, if you navigate away (which closes the player) and then return to the book, it shows the correct saved position but starts playing from the beginning.

## Root Causes Identified
1. **Vue.js layer**: The play method wasn't passing saved progress when no explicit startTime was provided ✅ FIXED
2. **iOS Native layer**: When creating a new AudioPlayer instance with `playWhenReady: false`, the player only seeks to saved position on first initialization, not when recreating the player

## Fixes Applied

### 1. Vue.js Fix (Already Applied)
Modified `/Users/lars.jensen/audiobookshelf-app/pages/item/_id/index.vue` to check for saved progress when no explicit startTime is provided.

### 2. iOS Native Logging Added
Added extensive logging to track the flow:
- `AbsAudioPlayer.swift`: Logs when playback sessions are created and what currentTime is used
- `PlayerHandler.swift`: Logs when startPlayback is called with session details
- `AudioPlayer.swift`: Enhanced logging for queue status observer seeking behavior

## Test Scenarios

### Scenario 1: Pause/Resume (WORKING)
1. Start playing an audiobook
2. Let it play for 30+ seconds
3. Pause the audiobook
4. Click play again
5. **Expected**: Resumes from paused position ✅
6. **Actual**: Works correctly

### Scenario 2: Navigate Away and Return (ISSUE)
1. Start playing an audiobook
2. Let it play for 30+ seconds (note the position)
3. Navigate back to library (player closes)
4. Navigate back to the same book
5. Note that UI shows correct saved position (e.g., "13:20")
6. Click play button
7. **Expected**: Should resume from saved position
8. **Current behavior**: Shows saved position but starts from 0:00

## Debug Output to Look For

When testing Scenario 2, check Xcode console for these logs:

1. When navigating back to the book:
```
[play] Using saved progress position: XXXs
```

2. When prepareLibraryItem is called:
```
Local playback session created with currentTime: XXXs
Using saved progress: XXXs
Final currentTime before starting: XXXs
```

3. When PlayerHandler starts:
```
startPlayback called - sessionId: XXX, currentTime: XXXs, playWhenReady: false
```

4. When AudioPlayer initializes:
```
Starting track index X for start time XXXs
```

5. When queue becomes ready:
```
queueStatusObserver: Current Item Ready to play. PlayWhenReady: false
queueStatusObserver: Seeking to saved position XXXs (not playing immediately)
```

## Potential Additional Fix Needed

The issue appears to be that when a new AudioPlayer is created (after navigating away and back), the initialization flow doesn't properly seek to the saved position when `playWhenReady` is false. The current code only seeks on "first ready" state, but when recreating the player, it might need to always seek to the saved position.

## Next Steps
1. Run the app with the current logging to confirm the exact flow
2. Verify that the saved position is correctly passed through all layers
3. If confirmed, implement a fix to ensure seeking happens when recreating the player