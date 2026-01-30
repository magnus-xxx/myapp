# Google Calendar Sync - Debugging Rendering Issues

## ✅ Current Status

The Google Calendar sync is **successfully fetching events** from the backend. The issue is that events may not be rendering in the calendar view.

## 🔍 Debugging Steps

### Step 1: Check Console Logs

When you click "Sync Google", you should see these logs:

**Terminal (Main Process):**
```
=== MAIN: Fetching Google Events ===
MAIN: Google API responded. Items found: X
MAIN: First converted item sample: { ... }
```

**Browser Console (Renderer):**
```
FE: Raw Google Events: [...]
FE: Number of events received: X
FE: First raw event structure: { ... }
FE: Normalized events count: X
FE: First normalized event: { ... }
FE: Merge complete. Local: X, Google: X, Total: X
```

### Step 2: Verify Event Structure

The events should have this structure:
```json
{
  "id": "gcal-abc123",
  "title": "Event Title",
  "start_time": "2026-01-15T14:00:00Z",  // ISO string
  "end_time": "2026-01-15T15:00:00Z",    // ISO string
  "type": "event",
  "status": "todo",
  "priority": "medium",
  "domain": "work",
  "is_all_day": false,
  "isSynced": true
}
```

### Step 3: Check Expansion Utility

The `calendarExpansion.ts` utility expects:
- `start_time` field (ISO string)
- `end_time` field (ISO string)
- Valid Date objects when parsed

**For All-Day Events:**
- `start_time`: "2026-01-15" (date only)
- `end_time`: "2026-01-15" (date only)
- `is_all_day`: true

**For Timed Events:**
- `start_time`: "2026-01-15T14:00:00Z" (full ISO)
- `end_time`: "2026-01-15T15:00:00Z" (full ISO)
- `is_all_day`: false

### Step 4: Verify Items State

After clicking "Sync Google", check the items state:
```javascript
// In browser console:
console.log('Current items:', items);
console.log('Google items:', items.filter(i => i.id?.toString().startsWith('gcal-')));
```

### Step 5: Check useMemo Expansion

The `events` useMemo should process the items:
```
[PlanView] useMemo: Processing X items
[CalendarExpansion] Processing items: X
[CalendarExpansion] ✓ Rendering Event: ...
```

## 🐛 Common Issues

### Issue 1: Events Not in Items State
**Symptom:** Console shows events received but `items` state doesn't include them.
**Fix:** Check the merge logic in `handleSync` - ensure `setItems` is called correctly.

### Issue 2: Events in State But Not Rendered
**Symptom:** `items` includes Google events but they don't appear on calendar.
**Fix:** Check `calendarExpansion.ts` logs - events may be failing validation.

### Issue 3: Invalid Date Format
**Symptom:** Expansion logs show "Invalid date" errors.
**Fix:** Ensure `start_time` and `end_time` are valid ISO strings.

### Issue 4: All-Day Events Not Rendering
**Symptom:** Only timed events appear, all-day events missing.
**Fix:** Check that all-day events have proper date format (YYYY-MM-DD).

## 🔧 Quick Fixes

### Fix 1: Force Re-render
After syncing, try navigating to a different month and back:
- Click the "Next" button
- Click the "Prev" button
- This forces the calendar to re-render

### Fix 2: Check Filters
Ensure type filters aren't hiding events:
- Check that "Events" filter is enabled
- Check domain filter (Google events default to "work")

### Fix 3: Verify Date Range
Ensure synced events are within the current month view:
- Check the month displayed in the calendar
- Verify event dates match the current month

## 📊 Expected Data Flow

```
1. User clicks "Sync Google"
   ↓
2. handleSync() calls window.api.calendar.getGoogleEvents()
   ↓
3. IPC: 'calendar:get-google-events'
   ↓
4. Main: getGoogleEvents() fetches from Google API
   ↓
5. Main: Converts to Magnus format with start_time/end_time
   ↓
6. Returns to renderer
   ↓
7. Renderer: Normalizes events (already have correct fields)
   ↓
8. Renderer: Merges with local items
   ↓
9. setItems() updates state
   ↓
10. useMemo re-runs with new items
   ↓
11. expandCalendarItems() processes each item
   ↓
12. expandEvent() parses start_time/end_time
   ↓
13. Returns ExpandedCalendarEvent[]
   ↓
14. react-big-calendar renders events
```

## 🧪 Manual Testing

### Test 1: Verify Backend
```javascript
// In browser console:
window.api.calendar.getGoogleEvents(
  '2026-01-01T00:00:00Z',
  '2026-01-31T23:59:59Z'
).then(events => {
  console.log('Backend returned:', events);
  console.log('First event:', events[0]);
});
```

### Test 2: Verify Expansion
```javascript
// After syncing, check expansion:
console.log('Items:', items);
console.log('Events (expanded):', events);
console.log('Google events in expansion:', events.filter(e => e.resource.isSynced));
```

### Test 3: Check Calendar Component
```javascript
// Verify calendar is receiving events:
console.log('Calendar events prop:', events);
console.log('Number of events:', events.length);
```

## ✅ Success Criteria

When working correctly, you should see:

1. **Terminal:** "MAIN: Converted X events to Magnus format"
2. **Browser Console:** "FE: Normalized events count: X"
3. **Browser Console:** "FE: Merge complete. Total: X"
4. **Browser Console:** "[CalendarExpansion] ✓ Rendering Event: ..."
5. **Calendar View:** Events appear with Google-blue left border

## 🎯 Next Steps

If events still don't render after checking all the above:

1. **Share Console Logs:** Copy the full console output from both terminal and browser
2. **Check Event Sample:** Share the "First normalized event" JSON from console
3. **Verify Expansion:** Share the "[CalendarExpansion]" logs
4. **Check State:** Share the output of `console.log(items)` after sync

The comprehensive logging we added should reveal exactly where the flow breaks!
