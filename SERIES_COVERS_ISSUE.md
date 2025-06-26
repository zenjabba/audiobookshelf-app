# Series Covers Issue Report

## Issue Summary
All series in the mobile app are displaying the same book covers, despite the backend claiming to have fixed series cover support in version 1.0.49.

## Root Cause
The backend API endpoint `/api/libraries/{libraryId}/series` is returning the same books array for every series, regardless of which books actually belong to each series.

## Evidence
From the API response logs, every series object contains an identical books array with the same 6 items:
- li_1 (with cover path: /metadata/items/li_1/cover.jpg)
- li_2 (with cover path: /metadata/items/li_2/cover.jpg)
- li_3 (with cover path: /metadata/items/li_3/cover.jpg)
- li_4 (with cover path: /metadata/items/li_4/cover.jpg)
- li_5 (with cover path: /metadata/items/li_5/cover.jpg)
- li_6 (with cover path: /metadata/items/li_6/cover.jpg)

This is happening for ALL series, which explains why all series show the same covers.

## Expected Behavior
Each series object should contain a books array with only the book IDs that actually belong to that specific series.

## Frontend Status
The mobile app frontend code is working correctly:
1. The GroupCover component properly handles both book IDs and full book objects
2. The cover URL generation logic is correct
3. The fallback UI for series without book data is implemented

## Backend Fix Required
The backend needs to:
1. Properly populate each series' books array with the correct book IDs for that specific series
2. Ensure the books array only contains books that actually belong to the series
3. Test that different series return different books arrays

## Temporary Frontend Mitigation
The app now displays an attractive fallback UI for series without valid book data, showing:
- A gradient background
- The series name
- Number of books in the series
- A collections icon

This ensures a good user experience even when book data is missing or incorrect.

## Testing
After the backend fix is deployed, verify that:
1. Different series show different book covers
2. The covers shown match the actual books in each series
3. Series with no books show the fallback UI