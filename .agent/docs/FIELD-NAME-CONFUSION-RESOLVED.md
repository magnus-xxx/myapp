# ⚠️ CRITICAL: Field Name Confusion Resolved

## 🚨 The Root Issue

You were looking for the **WRONG field names**!

### ❌ What You Thought:
```typescript
{
  date: "2026-01-06",        // WRONG - This doesn't exist!
  startTime: "14:00",        // WRONG - This doesn't exist!
  endTime: "15:00"           // WRONG - This doesn't exist!
}
```

### ✅ What Actually Exists:
```typescript
{
  start_time: "2026-01-06T14:00:00Z",  // ✓ Correct - ISO string
  end_time: "2026-01-06T15:00:00Z",    // ✓ Correct - ISO string
  is_all_day: false                     // ✓ Correct - boolean
}
```

## 📋 The CalendarItem Interface

From `src/shared/types.ts`:
```typescript
export interface CalendarItem {
  id?: number | string
  title: string
  type: ItemType
  domain: ItemDomain
  status: ItemStatus
  priority: ItemPriority
  
  // Time Fields - THESE ARE THE CORRECT ONES!
  start_time?: string  // ISO String (For Events)
  end_time?: string    // ISO String (For Events)
  due_date?: string    // ISO String (For Tasks/Milestones)
  is_all_day?: boolean // For all-day events
}
```

## 🔍 What the Expansion Utility Expects

From `src/renderer/src/utils/calendarExpansion.ts`:
```typescript
function expandEvent(item: CalendarItem): ExpandedCalendarEvent[] {
    if (!item.start_time) {  // ← Looking for start_time (snake_case)
        console.warn('[expandEvent] No start_time for event:', item.title)
        return []
    }
    
    const cleanedStart = cleanDateStr(item.start_time)  // ← Uses start_time
    const cleanedEnd = cleanDateStr(item.end_time)      // ← Uses end_time
    // ...
}
```

## ✅ What the Backend Sends

From `src/main/googleAuth.ts`:
```typescript
return {
  id: `gcal-${event.id}`,
  title: event.summary || '(No title)',
  start_time: startDateTime,  // ✓ ISO string like "2026-01-06T14:00:00Z"
  end_time: endDateTime,      // ✓ ISO string like "2026-01-06T15:00:00Z"
  type: 'event',
  is_all_day: isAllDay,
  isSynced: true
}
```

## 🎯 The Correct handleSync

**DO NOT use:**
- ❌ `date` field
- ❌ `startTime` field (camelCase)
- ❌ `endTime` field (camelCase)

**DO use:**
- ✅ `start_time` field (snake_case)
- ✅ `end_time` field (snake_case)
- ✅ `is_all_day` field (snake_case)

## 📝 Integration Steps

### Step 1: Open PlanView.tsx
Navigate to: `src/renderer/src/components/PlanView.tsx`

### Step 2: Find handleSync
Look for the function starting around line 215

### Step 3: Replace with Correct Version
Use the code from: `.agent/docs/handleSync-CORRECT-VERSION.ts`

This version:
- ✅ Uses `start_time` and `end_time` (correct snake_case)
- ✅ Validates ISO strings
- ✅ Adds comprehensive logging
- ✅ Matches the CalendarItem interface
- ✅ Works with the expansion utility

## 🧪 Expected Console Output

After clicking "Sync Google":

```
=== UI: Starting Google Calendar Sync ===
UI: Fetching events for period: { start: "...", end: "..." }
UI: Received events: 5
UI: First raw event from backend: {
  "id": "gcal-abc123",
  "title": "Team Meeting",
  "start_time": "2026-01-15T14:00:00Z",  ← Correct field!
  "end_time": "2026-01-15T15:00:00Z",    ← Correct field!
  "is_all_day": false
}
UI: Processing event 1: "Team Meeting"
  - start_time: 2026-01-15T14:00:00Z
  - end_time: 2026-01-15T15:00:00Z
  - is_all_day: false
  ✓ Normalized: { ... }
UI: Successfully normalized: 5 events
UI: Merge complete:
  - Local items: 10
  - Google items: 5
  - Total: 15
  ✓ Sample Google item in state: { start_time: "..." }
=== UI: Sync Complete ===
```

Then the expansion utility should process them:
```
[CalendarExpansion] Processing items: 15
[CalendarExpansion] Item 11/15: { id: "gcal-...", type: "event", start_time: "..." }
[CalendarExpansion] ✓ Rendering Event: Team Meeting Start: ... End: ...
```

## ⚠️ Why Your Previous Attempts Failed

1. **Wrong field names**: You were trying to access `date`, `startTime`, `endTime` which don't exist
2. **Trying to convert**: You were trying to convert to these wrong fields
3. **Expansion utility failed**: It couldn't find `start_time`, so it skipped all Google events

## ✅ Success Criteria

After using the CORRECT version:

1. ✅ Console shows "start_time: 2026-01-15T14:00:00Z" (not "date")
2. ✅ Console shows "✓ Sample Google item in state: { start_time: ... }"
3. ✅ Console shows "[CalendarExpansion] ✓ Rendering Event: ..."
4. ✅ Events appear in calendar view
5. ✅ Times show correctly in table view

---

**The CORRECT version is in `.agent/docs/handleSync-CORRECT-VERSION.ts`**

Copy it to PlanView.tsx and the events will render! 🎉
