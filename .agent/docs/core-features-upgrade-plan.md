# Core Features Upgrade - Implementation Plan

## Overview
Upgrading core features including sidebar filters activation, improved input form, quick actions, and milestone logic.

## Changes Required

### ✅ 1. Types Added (shared/types.ts)
- Added `is_all_day?: boolean` to CalendarItem

### 🔄 2. Sidebar Filters Activation (PlanView.tsx)

**Current State:**
- PlanView has `typeFilters` state
- Sidebar shows filter icons
- **Problem:** Filters are visual only, not connected to data

**Required Changes:**
- PlanView already calls `loadItems()` with type filters
- Need to verify API actually uses the `types` parameter
- Ensure `useCalendarItems` hook passes types to API

**Implementation:**
```typescript
// In PlanView.tsx - Already implemented!
const filters: any = {}
if (activeDomain !== 'all') filters.domains = [activeDomain]
if (typeFilters.size > 0 && typeFilters.size < 4) {
    filters.types = Array.from(typeFilters)
}
const data = await window.api.getCalendarItems(filters)
```

**Status:** ✅ Already implemented, just needs backend verification

### 🔄 3. CreateItemModal Upgrades

#### A. All-Day Toggle

**New State:**
```typescript
const [isAllDay, setIsAllDay] = useState(false)
```

**UI Changes:**
- Add toggle switch before time inputs
- When ON: Hide time inputs, show only date
- When OFF: Show date + time inputs

**Save Logic:**
```typescript
if (itemType === 'event') {
    if (isAllDay) {
        itemData.is_all_day = true
        itemData.start_time = `${startDate}T00:00:00`
        itemData.end_time = `${endDate || startDate}T23:59:59`
    } else {
        itemData.is_all_day = false
        itemData.start_time = `${startDate}T${startTime}:00`
        itemData.end_time = `${endDate || startDate}T${endTime || startTime}:00`
    }
}
```

#### B. Time Picker UX Improvement

**Current:**
```
Start Date: [____]
Start Time: [____]
End Date:   [____]
End Time:   [____]
```

**New Layout:**
```
[Start Date] [Start Time] → [End Time]
```

**Logic:**
- End date defaults to start date
- End time defaults to start time + 1 hour
- Show arrow between start and end

#### C. Task-Specific Fields

**Status Select:**
```tsx
{itemType === 'task' && (
    <div className="form-row">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">To Do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
        </select>
    </div>
)}
```

**Estimate Time Input:**
```tsx
{itemType === 'task' && (
    <div className="form-row">
        <label>Estimated Time</label>
        <input 
            type="number" 
            value={estimatedTime} 
            onChange={(e) => setEstimatedTime(e.target.value)}
            placeholder="Minutes"
        />
        <span>{formatTime(estimatedTime)}</span> {/* "1h 30m" */}
    </div>
)}
```

**Helper Function:**
```typescript
const formatTime = (minutes: string) => {
    const mins = parseInt(minutes)
    if (isNaN(mins) || mins === 0) return ''
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    if (hours > 0 && remainingMins > 0) return `${hours}h ${remainingMins}m`
    if (hours > 0) return `${hours}h`
    return `${remainingMins}m`
}
```

#### D. Event-Specific Logic

**End Time Default:**
```typescript
useEffect(() => {
    if (itemType === 'event' && startTime && !endTime) {
        // Default to start time + 1 hour
        const [hours, minutes] = startTime.split(':')
        const endHour = (parseInt(hours) + 1) % 24
        setEndTime(`${endHour.toString().padStart(2, '0')}:${minutes}`)
    }
}, [startTime, itemType])
```

### 🔄 4. Quick Actions (Checkbox)

#### A. Calendar Event Component

**Add Checkbox:**
```tsx
function CustomEvent({ event }: any) {
    const item = event.resource
    const canToggle = item.type === 'task' || item.type === 'habit'
    
    const handleCheckboxClick = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent opening modal
        const newStatus = item.status === 'done' ? 'todo' : 'done'
        await window.api.updateCalendarItem(item.id.toString(), { status: newStatus })
        // Trigger refresh
    }
    
    return (
        <div>
            {canToggle && (
                <input 
                    type="checkbox" 
                    checked={item.status === 'done'}
                    onClick={handleCheckboxClick}
                    style={{ marginRight: '4px' }}
                />
            )}
            {/* Rest of event */}
        </div>
    )
}
```

#### B. Kanban Card Component

**Add Checkbox:**
```tsx
function KanbanCard({ item, onClick }: KanbanCardProps) {
    const canToggle = item.type === 'task' || item.type === 'habit'
    
    const handleCheckboxClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        const newStatus = item.status === 'done' ? 'todo' : 'done'
        await window.api.updateCalendarItem(item.id!.toString(), { status: newStatus })
        // Trigger refresh
    }
    
    return (
        <div>
            {canToggle && (
                <input 
                    type="checkbox" 
                    checked={item.status === 'done'}
                    onClick={handleCheckboxClick}
                />
            )}
            {/* Rest of card */}
        </div>
    )
}
```

### 🔄 5. Milestone Logic

#### A. Status for Milestones

**Already Supported:**
- Milestones use the same `ItemStatus` type
- Can be: 'todo' | 'doing' | 'done'

**UI Update:**
```typescript
// In CreateItemModal
{itemType === 'milestone' && (
    <div className="form-row">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">Pending</option>
            <option value="done">Completed</option>
        </select>
    </div>
)}
```

#### B. Distinctive Rendering

**Calendar:**
```tsx
// In CustomEvent
const getIcon = () => {
    switch (item.type) {
        case 'milestone':
            return <Flag size={12} style={{ 
                color: item.status === 'done' ? '#10b981' : '#f59e0b',
                marginRight: '4px' 
            }} />
        // ... other cases
    }
}
```

**Kanban:**
- Already uses Flag icon for milestones
- Add color based on status

## Implementation Order

### Phase 1: Types & State (Completed)
- [x] Add `is_all_day` to CalendarItem type

### Phase 2: CreateItemModal Upgrades
- [ ] Add all-day toggle state
- [ ] Add status select for tasks/milestones
- [ ] Add estimate time input for tasks
- [ ] Improve time picker layout
- [ ] Add end time default logic for events
- [ ] Update save logic to handle all-day

### Phase 3: Quick Actions
- [ ] Add checkbox to CustomEvent component
- [ ] Add checkbox to KanbanCard component
- [ ] Implement toggle handler with refresh
- [ ] Add visual feedback (instant strikethrough)

### Phase 4: Milestone Polish
- [ ] Add status select to milestone form
- [ ] Update icon colors based on status
- [ ] Ensure distinctive rendering

### Phase 5: Testing
- [ ] Test all-day events
- [ ] Test task status changes
- [ ] Test quick checkbox toggle
- [ ] Test milestone status
- [ ] Test backward compatibility (existing items)

## Backward Compatibility

### Handling Null Values

**is_all_day:**
```typescript
const isAllDay = item.is_all_day ?? false // Default to false
```

**estimate_minutes:**
```typescript
const estimate = item.estimate_minutes ?? 0 // Default to 0
```

**Status:**
```typescript
const status = item.status ?? 'todo' // Default to todo
```

## UI Mockups

### CreateItemModal - Event (All-Day ON)
```
Type: [Event] [Task] [Milestone] [Habit]

Title: [________________]

☑ All Day

Start: [2026-01-08] 
End:   [2026-01-08]

[Save] [Cancel]
```

### CreateItemModal - Event (All-Day OFF)
```
Type: [Event] [Task] [Milestone] [Habit]

Title: [________________]

☐ All Day

[2026-01-08] [10:00] → [11:00]

[Save] [Cancel]
```

### CreateItemModal - Task
```
Type: [Event] [Task] [Milestone] [Habit]

Title: [________________]

Status: [To Do ▼]

Due Date: [2026-01-08]

Estimated Time: [60] minutes (1h)

[Save] [Cancel]
```

### Calendar Event with Checkbox
```
☐ 10:30am Team Meeting
☑ Daily Standup (strikethrough, dimmed)
```

### Kanban Card with Checkbox
```
┌─────────────────────────────┐
│ ☐ work • development   HIGH │
│                             │
│ Implement new feature       │
│                             │
│ 🕐 Jan 8, 2:00 PM    TASK   │
└─────────────────────────────┘
```

## Testing Scenarios

### All-Day Events
1. Create event with all-day ON → Saves with is_all_day=true
2. Edit event, toggle all-day OFF → Shows time inputs
3. Existing event without is_all_day → Defaults to false

### Task Status
1. Create task with status "Doing" → Saves correctly
2. Edit task, change to "Done" → Updates status
3. Existing task without status → Defaults to "todo"

### Quick Checkbox
1. Click checkbox on task → Toggles done/todo
2. Click checkbox on habit → Toggles done/todo
3. Event has no checkbox → Correct
4. Checkbox click doesn't open modal → Correct

### Milestone
1. Create milestone with "Pending" → Saves as todo
2. Change to "Completed" → Saves as done
3. Flag icon changes color → Visual feedback

## Known Issues & Solutions

**Issue:** Clicking checkbox opens modal
**Solution:** `e.stopPropagation()` in checkbox handler

**Issue:** Checkbox state doesn't update immediately
**Solution:** Trigger parent refresh after API call

**Issue:** Existing items break
**Solution:** Use nullish coalescing (`??`) for defaults

**Issue:** Time picker layout breaks on mobile
**Solution:** Use flexbox with wrap

## Success Criteria

- [ ] All-day toggle works for events
- [ ] Time picker shows improved layout
- [ ] Task status can be set and changed
- [ ] Estimate time displays as "1h 30m"
- [ ] Checkbox toggles task/habit status
- [ ] Checkbox doesn't open modal
- [ ] Milestone status works
- [ ] Milestone icon shows correct color
- [ ] Existing items render correctly
- [ ] No console errors
