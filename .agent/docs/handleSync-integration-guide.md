# Google Calendar Sync - Final Fix Guide

## 🎯 The Problem

Google Calendar events are being fetched successfully but not rendering because:
1. **Table View:** Shows title but "Time/Due" is empty (`-`)
2. **Calendar View:** Events don't appear on the grid

## 🔍 Root Cause Analysis

The backend is **correctly** sending:
```json
{
  "id": "gcal-abc123",
  "title": "Team Meeting",
  "start_time": "2026-01-15T14:00:00Z",  // ✅ Correct ISO string
  "end_time": "2026-01-15T15:00:00Z",    // ✅ Correct ISO string
  "is_all_day": false,
  "isSynced": true
}
```

The `calendarExpansion.ts` utility expects exactly this format and should work correctly.

## ✅ Solution Applied

I've created a comprehensive `handleSync` replacement function that:

1. **Uses `currentDate` state** instead of `new Date()` for proper month range
2. **Validates all fields** before normalization
3. **Handles missing/invalid end_time** by defaulting to start + 1 hour
4. **Preserves all Google metadata** (googleEventId, googleCalendarId)
5. **Adds extensive logging** at every step
6. **Filters by `isSynced` flag** instead of just ID prefix

## 📝 Manual Integration Steps

### Step 1: Open PlanView.tsx

Navigate to: `src/renderer/src/components/PlanView.tsx`

### Step 2: Find the handleSync function

Look for line ~215 that starts with:
```typescript
const handleSync = async () => {
```

### Step 3: Replace the entire function

Replace everything from line 215 to line 264 (the closing `};`) with the code from:
`.agent/docs/handleSync-replacement.ts`

### Step 4: Save and Test

1. Save the file
2. The app should hot-reload
3. Navigate to Plan view
4. Click "Sync Google"
5. Check the console for detailed logs

## 🧪 Expected Console Output

After clicking "Sync Google", you should see:

```
=== UI: Starting Google Calendar Sync ===
UI: Sync period: { start: "...", end: "..." }
UI: Current date: Wed Jan 09 2026...
UI: Raw Google Events received: 5
UI: First raw event: {
  "id": "gcal-abc123",
  "title": "Team Meeting",
  "start_time": "2026-01-15T14:00:00Z",
  ...
}
UI: Normalizing event 1/5: Team Meeting
UI: Normalized event 1: {
  "id": "gcal-abc123",
  "title": "Team Meeting",
  "start_time": "2026-01-15T14:00:00Z",
  "end_time": "2026-01-15T15:00:00Z",
  "is_all_day": false
}
...
UI: Successfully normalized events: 5
UI: Merge complete.
  - Local items: 10
  - Google items: 5
  - Total items: 15
UI: Sample Google item in merged state: { ... }
=== UI: Sync Complete ===
```

## 🔍 Debugging Steps

### If events still don't render:

1. **Check the expansion logs:**
   ```
   [CalendarExpansion] Processing items: 15
   [CalendarExpansion] Item 11/15: { id: "gcal-...", type: "event", start_time: "..." }
   [expandEvent] No start_time for event: ...  ← Look for this error
   ```

2. **Verify the merged state:**
   ```javascript
   // In browser console after sync:
   console.log('Items:', items);
   console.log('Google items:', items.filter(i => i.isSynced));
   ```

3. **Check the events array:**
   ```javascript
   // In browser console:
   console.log('Expanded events:', events);
   console.log('Google events in calendar:', events.filter(e => e.resource.isSynced));
   ```

## 🎨 Visual Indicators

Google events should have:
- **Blue left border** (from `isSynced: true` styling)
- **"work" domain color** (blue)
- **"event" type icon**

## ⚠️ Common Issues

### Issue 1: "Event missing start_time"
**Cause:** Backend not sending start_time
**Fix:** Check `googleAuth.ts` line 344 - ensure it's returning `start_time`

### Issue 2: "Invalid start_time"
**Cause:** start_time is not a valid ISO string
**Fix:** Check backend logs for "MAIN: First converted item sample"

### Issue 3: Events in state but not visible
**Cause:** Expansion utility failing to parse dates
**Fix:** Check for "[expandEvent] Invalid start_time" in console

### Issue 4: Duplicate events on multiple syncs
**Cause:** Filter not removing old Google events
**Fix:** The new code filters by `isSynced` flag - should fix this

## 🚀 Next Steps

After integration:

1. **Test with real Google Calendar data**
2. **Verify all-day events render correctly**
3. **Test month navigation** (events should persist)
4. **Test multiple syncs** (no duplicates)
5. **Verify visual styling** (blue border for synced events)

## 📊 Success Criteria

✅ Console shows "UI: Successfully normalized events: X"
✅ Console shows "UI: Merge complete. Google items: X"
✅ Console shows "[CalendarExpansion] ✓ Rendering Event: ..."
✅ Events appear in calendar view
✅ Events show correct time in table view
✅ Google events have blue left border

---

**The replacement code is ready in `.agent/docs/handleSync-replacement.ts`**

Simply copy-paste it to replace the current `handleSync` function in `PlanView.tsx`!
