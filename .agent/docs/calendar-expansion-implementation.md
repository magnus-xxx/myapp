# Calendar Item Expansion & Timezone Fix Implementation

## Overview
Implemented a robust calendar item expansion system that fixes critical bugs with habit visibility and event timezone issues. The system properly handles all 4 item types (Events, Tasks, Milestones, Habits) with correct rendering logic.

## Critical Bugs Fixed

### 1. **Habits Are Now Visible**
- **Problem**: Habits were stored as single records with recurrence rules but didn't appear on specific dates
- **Solution**: Implemented `rrule`-based expansion that generates "virtual instances" for each occurrence within the calendar view range
- **Result**: Habits now appear daily/weekly/monthly as expected

### 2. **Events No Longer Span 2 Days**
- **Problem**: Events created for a single day (e.g., 10 AM - 2 PM) sometimes rendered across 2 days due to timezone conversion
- **Solution**: Removed 'Z' suffix from datetime strings to parse as LOCAL time instead of UTC
- **Result**: Events stay within their intended day

## Implementation Details

### New Utility: `calendarExpansion.ts`
Created `/src/renderer/src/utils/calendarExpansion.ts` with the following functions:

#### `expandCalendarItems(items, viewStart, viewEnd)`
Main expansion function that processes all calendar items:

**Events:**
- Parse as LOCAL time (no 'Z' suffix)
- Default end time to start + 1 hour if missing
- Detect all-day events (midnight to midnight)

**Tasks:**
- Render on due date as all-day events
- Parse date only, ignore time component

**Milestones:**
- Render on target date as all-day events
- Always force `allDay: true`

**Habits:**
- Use `RRule` to generate instances between viewStart and viewEnd
- Create virtual events for each occurrence
- Add streak emoji based on habit progress (○ → ✨ → ⚡ → 🔥)
- Each virtual instance has unique ID: `{itemId}-habit-{date}`

### Updated Components

#### `PlanView.tsx`
- Replaced manual event mapping with `expandCalendarItems()` utility
- Added `currentDate` and `calendarView` to useMemo dependencies for proper habit expansion
- Removed redundant `getDomainColor` function (now in utility)

#### `CreateItemModal.tsx`
- **Events**: Require start date + time, store as LOCAL time (no Z suffix)
- **Tasks**: Require due date, store as end of day
- **Milestones**: Require target date, store as end of day
- **Habits**: Require start date for recurrence calculation
- Added validation alerts for missing required fields
- Removed unused icon imports

## Data Format Standards

### Event Storage
```typescript
{
  start_time: "2026-01-08T10:00:00",  // LOCAL time, no Z
  end_time: "2026-01-08T14:00:00"     // LOCAL time, no Z
}
```

### Task/Milestone Storage
```typescript
{
  due_date: "2026-01-15T23:59:59"  // End of day, LOCAL time
}
```

### Habit Storage
```typescript
{
  start_time: "2026-01-01T00:00:00",  // Start of recurrence
  metadata: {
    habit_frequency: "daily" | "weekly" | "monthly",
    habit_streak: 5,
    target_streak: 30
  }
}
```

## RRule Integration

### Frequency Mapping
- `daily` → `RRule.DAILY`
- `weekly` → `RRule.WEEKLY`
- `monthly` → `RRule.MONTHLY`

### Instance Generation
```typescript
const rule = new RRule({
    freq: rruleFreq,
    dtstart: habitStart,
    until: viewEnd
})
const instances = rule.between(viewStart, viewEnd, true)
```

## Visual Enhancements

### Habit Streak Emojis
- 0-2 days: ○ (empty circle)
- 3-6 days: ✨ (sparkles)
- 7-29 days: ⚡ (lightning)
- 30+ days: 🔥 (fire)

### Domain Colors
- Work: `#3b82f6` (blue)
- Study: `#8b5cf6` (purple)
- Life: `#10b981` (green)
- Invest: `#f59e0b` (amber)

## Testing Checklist

- [x] Events render on correct single day
- [x] Tasks appear on due date as all-day
- [x] Milestones appear on target date as all-day
- [x] Daily habits generate instances for each day in view
- [x] Weekly habits generate instances for each week
- [x] Monthly habits generate instances for each month
- [x] Timezone no longer causes date spillover
- [x] Required field validation works in CreateItemModal
- [x] Habit streak emojis display correctly

## Dependencies
- `rrule` (v2.8.1) - Already installed
- `moment` - For date calculations in view range

## Files Modified
1. `/src/renderer/src/utils/calendarExpansion.ts` (NEW)
2. `/src/renderer/src/components/PlanView.tsx`
3. `/src/renderer/src/components/CreateItemModal.tsx`

## Next Steps
- Test habit editing to ensure recurrence rules update correctly
- Consider adding habit completion tracking
- Implement habit streak increment logic
- Add visual indicators for completed habit instances
