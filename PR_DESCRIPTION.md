# Pull Request: Fix download management and series cover handling

**From:** armsby/audiobookshelf-app (datahorders branch)
**To:** zenjabba/audiobookshelf-app (master branch)

## Summary
- Implemented stuck download detection and clearing functionality
- Added fallback UI for series when book data is missing
- Enhanced series cover handling to work with both book IDs and objects

## Changes

### Download Management
- Added detection for stuck downloads (>90% progress but not completing)
- Implemented "Clear Failed" button in download management UI
- Added confirmation dialogs for clearing stuck/failed downloads
- Enhanced download button logic to detect and handle stuck downloads

### Series Cover Improvements
- Modified GroupCover component to handle book IDs in addition to full book objects
- Added attractive fallback UI for series without valid book data (gradient background with series name and book count)
- Added debug logging to help investigate backend issues

### Backend Issue Documentation
- Created detailed issue report documenting that backend returns same books array for all series
- This explains why all series show identical covers - it's a backend data issue, not a frontend rendering issue

## Test Plan
- [x] Test download management with stuck downloads
- [x] Verify series display with fallback UI when book data is missing
- [x] Confirm proper series cover display when valid book data is provided
- [x] Test on both iOS and Android devices

## Backend Fix Required
The backend API is currently returning the same books array (li_1 through li_6) for every series. Once this is fixed, series covers will display correctly.

## Files Changed
- `components/bookshelf/LazyBookshelf.vue` - Added debug logging for series data
- `components/cards/LazySeriesCard.vue` - Added fallback UI for series without book data
- `components/covers/GroupCover.vue` - Enhanced to handle book IDs and added debug logging
- `pages/downloading.vue` - Added stuck download detection and clearing
- `pages/item/_id/index.vue` - Enhanced download button logic for stuck downloads
- `SERIES_COVERS_ISSUE.md` - Documentation of backend issue

## Commits
- c5cbbe89 fix: improve download management and series cover handling

🤖 Generated with [Claude Code](https://claude.ai/code)