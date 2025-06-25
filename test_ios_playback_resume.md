# iOS Playback Resume Fix Test Plan

## Issue
When playing an audiobook in the iOS app, it starts from the beginning instead of resuming from the saved position.

## Root Cause
The Vue.js play method wasn't passing the saved progress when the play button was clicked without a timestamp. It only passed `startTime` when explicitly provided (like clicking a timestamp).

## Fix Applied
Modified `/Users/lars.jensen/audiobookshelf-app/pages/item/_id/index.vue` in the `play` method (lines 593-601) to:
1. Check if no explicit startTime is provided
2. Get the appropriate progress based on whether it's local or server item
3. Use the saved progress currentTime as the startTime

```javascript
// If no explicit startTime provided, check for saved progress
if (startTime === null || startTime === undefined) {
  // Get the appropriate progress based on whether it's local or server
  const progress = libraryItemId === this.localLibraryItem?.id ? this.localItemProgress : this.serverItemProgress
  if (progress?.currentTime > 0) {
    console.log(`[play] Using saved progress position: ${progress.currentTime}s`)
    startTime = progress.currentTime
  }
}
```

## Test Steps
1. Open the iOS app in simulator: `npx cap open ios`
2. Connect to a server and navigate to an audiobook
3. Start playing the audiobook
4. Let it play for at least 30 seconds to ensure progress is saved
5. Pause the audiobook and note the current position
6. Navigate away from the book (go back to library)
7. Navigate back to the same book
8. Click the play button
9. **Expected**: The book should resume from the saved position
10. **Previous behavior**: The book would start from 0:00

## Verification in Logs
When testing, you should see the following log message in the Xcode console:
```
[play] Using saved progress position: XXXs
```

Where XXX is the saved position in seconds.

## Additional Debugging
The iOS native code also has logging to show whether it's using the startTimeOverride or saved progress:
- `Using startTimeOverride: XXs` - when explicit start time is provided
- `Using saved progress: XXs` - when using saved position