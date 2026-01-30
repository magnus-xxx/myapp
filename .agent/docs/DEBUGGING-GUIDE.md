# 🔍 Google Calendar Sync Debugging Guide

## ❌ Current Problem

Backend is receiving Google Calendar events successfully, but the Frontend is NOT displaying them.

## 🎯 Root Cause Analysis

### **Issue #1: Invalid Fields in CalendarItem**

The `CalendarItem` interface does NOT have these fields:
- ❌ `date` 
- ❌ `startTime` (camelCase)
- ❌ `endTime` (camelCase)

The interface ONLY has:
- ✅ `start_time` (snake_case)
- ✅ `end_time` (snake_case)
- ✅ `is_all_day`

**Problem:** When we create normalized events with invalid fields and cast to `CalendarItem`, TypeScript may strip out the invalid fields or the expansion utility ignores them.

### **Issue #2: Missing Comprehensive Logging**

We need to see EXACTLY what data is flowing through each step:
1. What backend sends
2. What frontend receives
3. What gets normalized
4. What gets merged into state
5. What the expansion utility sees

## 🔧 The Fix

### **Step 1: Replace `handleSync` in PlanView.tsx**

**Location:** `src/renderer/src/components/PlanView.tsx` (around line 215)

**Replace the entire `handleSync` function with the code from:**
`.agent/docs/handleSync-FIXED.ts`

### **Key Changes:**

1. **Only Use Valid CalendarItem Fields:**
```typescript
// ❌ WRONG - These fields don't exist in CalendarItem
{
  date: dateStr,
  startTime: startTime,
  endTime: endTime,
  start_time: start_time_iso,
  end_time: end_time_iso
}

// ✅ CORRECT - Only use interface fields
{
  start_time: start_time_iso,  // ISO string
  end_time: end_time_iso,      // ISO string
  is_all_day: isAllDay
}
```

2. **Comprehensive Logging at Every Step:**
```typescript
console.log('UI: Received Raw Events:', googleRawEvents);
console.log('UI: First RAW event structure:', JSON.stringify(googleRawEvents[0], null, 2));
console.log(`UI: Event "${title}" - startData:`, startData);
console.log(`UI: Timed event - start_time: ${start_time_iso}`);
console.log(`UI: Normalized item:`, item);
console.log('UI: Merged items:', merged);
```

3. **Null Filtering:**
```typescript
.filter((item): item is CalendarItem => item !== null)
```

## 🧪 Debugging Steps

### **Step 1: Check Backend Output**

In the terminal, you should see:
```
MAIN: Returning 2 RAW items to renderer.
MAIN: First event sample (RAW): {
  id: 'abc123',
  summary: 'Team Meeting',
  start: { dateTime: '2026-01-06T10:00:00-05:00' },
  end: { dateTime: '2026-01-06T10:30:00-05:00' }
}
```

### **Step 2: Check Frontend Reception**

In browser console, you should see:
```
UI: Received Raw Events: [...]
UI: Number of events: 2
UI: First RAW event structure: {
  "id": "abc123",
  "summary": "Team Meeting",
  "start": {
    "dateTime": "2026-01-06T10:00:00-05:00"
  }
}
```

### **Step 3: Check Normalization**

```
UI: Processing event ID: abc123, summary: Team Meeting
UI: Event "Team Meeting" - startData: { dateTime: "..." }
UI: Timed event - start_time: 2026-01-06T15:00:00.000Z
UI: Normalized item: {
  "id": "gcal-abc123",
  "title": "Team Meeting",
  "start_time": "2026-01-06T15:00:00.000Z",
  "end_time": "2026-01-06T15:30:00.000Z",
  "is_all_day": false,
  "type": "event"
}
```

### **Step 4: Check State Merge**

```
UI: State merge - Local: 5, Google: 2, Total: 7
UI: Merged items: [...]
```

### **Step 5: Check Expansion**

```
[CalendarExpansion] Processing items: 7
[CalendarExpansion] Item 6/7: { id: "gcal-abc123", type: "event", start_time: "..." }
[CalendarExpansion] ✓ Rendering Event: Team Meeting Start: ... End: ...
```

## ⚠️ Common Issues

### **Issue: "Event has no valid start time"**

**Cause:** The event object doesn't have `evt.start.dateTime` or `evt.start.date`

**Fix:** Check that backend is returning raw Google objects, not transformed ones

### **Issue: "Items is not an array"**

**Cause:** Backend returned `undefined` or an error

**Fix:** Check backend logs for API errors

### **Issue: "No events in expansion"**

**Cause:** Events don't have valid `start_time` field

**Fix:** Check normalized events have `start_time` as ISO string

### **Issue: "Events in state but not visible"**

**Cause:** Expansion utility failing to parse dates

**Fix:** Check `start_time` is a valid ISO string like "2026-01-06T15:00:00.000Z"

## ✅ Success Criteria

After clicking "Sync Google", you should see:

1. ✅ Terminal: "MAIN: Returning X RAW items to renderer"
2. ✅ Browser: "UI: Received Raw Events: [...]"
3. ✅ Browser: "UI: Total normalized events: X"
4. ✅ Browser: "UI: State merge - Total: X"
5. ✅ Browser: "[CalendarExpansion] ✓ Rendering Event: ..."
6. ✅ UI: Events appear in calendar/table view

## 📝 Integration Instructions

1. Open `src/renderer/src/components/PlanView.tsx`
2. Find the `handleSync` function (around line 215)
3. Replace the ENTIRE function with the code from `.agent/docs/handleSync-FIXED.ts`
4. Save the file
5. The app should hot-reload
6. Click "Sync Google" and check the console logs

---

**The new version has extensive logging to help us identify exactly where the data flow breaks!**
