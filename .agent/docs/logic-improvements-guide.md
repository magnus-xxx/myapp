# Logic and Feature Improvements Implementation Guide

## Overview
This document outlines the implementation of habit end dates, performance tracking, table filtering, and sidebar filter functionality.

## 1. Habit End Date Implementation

### Types Updated (`types.ts`)
```typescript
// Added to ItemMetadata
habit_end_date?: string // ISO String - When habit recurrence should stop

// Added to CalendarItem
actual_end_time?: string // ISO String - When item was actually completed
checklist?: ChecklistItem[] // Sub-tasks/checklist items
recurrence_rule?: string // RRULE string for recurring items
project_id?: string

// New interface
export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  created_at?: string
}
```

### Calendar Expansion Updated (`calendarExpansion.ts`)
- Habits now use `metadata.habit_end_date` if available
- Default to 1 year from start if not specified
- Prevents infinite rendering by capping at habitEnd or viewEnd (whichever is earlier)

### CreateItemModal Changes Needed

**Add to habit row (after target streak):**
```tsx
{itemType === 'habit' && (
    <div className="meta-row">
        <Repeat size={18} className="meta-icon" />
        <div className="meta-content">
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as any)} className="inline-select">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
            </select>
            <span className="separator">•</span>
            <input
                type="number"
                value={targetStreak}
                onChange={(e) => setTargetStreak(e.target.value)}
                placeholder="Target streak"
                className="inline-input small"
            />
            <span className="separator">•</span>
            <input
                type="date"
                value={habitEndDate}
                onChange={(e) => setHabitEndDate(e.target.value)}
                placeholder="End date (optional)"
                className="inline-input"
            />
        </div>
    </div>
)}
```

**Update handleSubmit for habits:**
```typescript
if (itemType === 'habit') {
    metadata.habit_streak = initialItem?.metadata?.habit_streak || 0
    metadata.habit_frequency = recurrence !== 'none' ? recurrence : 'daily'
    if (targetStreak) metadata.target_streak = parseInt(targetStreak)
    if (habitEndDate) metadata.habit_end_date = `${habitEndDate}T23:59:59`
}
```

## 2. Performance Tracking (Checklist & Actual End Time)

### Checklist UI Component

**Add before description section:**
```tsx
{/* Checklist Section (Tasks only) */}
{itemType === 'task' && (
    <div className="meta-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <CheckSquare size={18} className="meta-icon" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d1d5db' }}>Checklist</span>
        </div>
        
        {/* Checklist Items */}
        {checklist.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 4px 30px' }}>
                <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {
                        setChecklist(checklist.map(ci => 
                            ci.id === item.id ? { ...ci, completed: !ci.completed } : ci
                        ))
                    }}
                    style={{ cursor: 'pointer' }}
                />
                <span style={{ 
                    fontSize: '0.8125rem', 
                    color: item.completed ? '#6b7280' : '#d1d5db',
                    textDecoration: item.completed ? 'line-through' : 'none'
                }}>
                    {item.text}
                </span>
                <button
                    type="button"
                    onClick={() => setChecklist(checklist.filter(ci => ci.id !== item.id))}
                    style={{ 
                        marginLeft: 'auto', 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#6b7280', 
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                    }}
                >
                    ×
                </button>
            </div>
        ))}
        
        {/* Add Checklist Item */}
        <div style={{ display: 'flex', gap: '8px', padding: '4px 0 0 30px' }}>
            <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Add checklist item..."
                className="inline-input"
                style={{ flex: 1 }}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && newChecklistItem.trim()) {
                        e.preventDefault()
                        setChecklist([...checklist, {
                            id: Date.now().toString(),
                            text: newChecklistItem.trim(),
                            completed: false
                        }])
                        setNewChecklistItem('')
                    }
                }}
            />
            <button
                type="button"
                onClick={() => {
                    if (newChecklistItem.trim()) {
                        setChecklist([...checklist, {
                            id: Date.now().toString(),
                            text: newChecklistItem.trim(),
                            completed: false
                        }])
                        setNewChecklistItem('')
                    }
                }}
                style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                }}
            >
                Add
            </button>
        </div>
    </div>
)}
```

### Actual End Time UI

**Add for tasks/milestones when editing:**
```tsx
{/* Actual End Time (Edit mode only) */}
{initialItem && (itemType === 'task' || itemType === 'milestone') && (
    <div className="meta-row">
        <Clock size={18} className="meta-icon" />
        <div className="meta-content">
            <input
                type="datetime-local"
                value={actualEndTime}
                onChange={(e) => setActualEndTime(e.target.value)}
                placeholder="Actual completion time"
                className="inline-input"
            />
            {actualEndTime && dueDate && (() => {
                const due = new Date(dueDate)
                const actual = new Date(actualEndTime)
                const diffMinutes = Math.round((actual.getTime() - due.getTime()) / 60000)
                return (
                    <span style={{ 
                        fontSize: '0.75rem', 
                        color: diffMinutes < 0 ? '#10b981' : '#ef4444',
                        marginLeft: '8px'
                    }}>
                        {diffMinutes < 0 ? `Early by ${Math.abs(diffMinutes)} mins` : `Overdue by ${diffMinutes} mins`}
                    </span>
                )
            })()}
        </div>
    </div>
)}
```

### Update handleSubmit

```typescript
// Add checklist and actual_end_time to itemData
const itemData: any = {
    title: title.trim(),
    description: description.trim() || undefined,
    type: itemType,
    domain: domain,
    status: initialItem?.status || 'todo',
    priority: priority,
    metadata: metadata,
    checklist: checklist.length > 0 ? checklist : undefined,
    actual_end_time: actualEndTime || undefined
}
```

## 3. Table View Date Filter

### Add to TableView.tsx

**Add state and filter logic:**
```typescript
const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

const filteredEvents = useMemo(() => {
    if (!filterMonth) return events
    
    return events.filter(event => {
        const itemDate = event.start_time || event.due_date || event.created_at
        if (!itemDate) return false
        return itemDate.startsWith(filterMonth)
    })
}, [events, filterMonth])
```

**Add UI above table:**
```tsx
<div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <label style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Filter by month:</label>
    <input
        type="month"
        value={filterMonth}
        onChange={(e) => setFilterMonth(e.target.value)}
        style={{
            background: '#2d2d2d',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            outline: 'none'
        }}
    />
    <button
        onClick={() => setFilterMonth('')}
        style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#9ca3af',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
        }}
    >
        Clear Filter
    </button>
</div>
```

## 4. Kanban Domain Colors

### Update KanbanView.tsx

**Add domain color to card styling:**
```typescript
const getDomainColor = (domain: ItemDomain) => {
    switch (domain) {
        case 'work': return '#3b82f6'
        case 'study': return '#8b5cf6'
        case 'life': return '#10b981'
        case 'invest': return '#f59e0b'
        default: return '#6b7280'
    }
}

// In card rendering:
<div style={{
    ...cardStyle,
    borderLeft: `3px solid ${getDomainColor(event.domain)}`
}}>
```

## 5. Sidebar Filter Functionality

### Update PlanView.tsx

**Add filter state:**
```typescript
const [typeFilters, setTypeFilters] = useState<Set<ItemType>>(new Set(['task', 'event', 'milestone', 'habit']))

const toggleTypeFilter = (type: ItemType) => {
    const newFilters = new Set(typeFilters)
    if (newFilters.has(type)) {
        newFilters.delete(type)
    } else {
        newFilters.add(type)
    }
    setTypeFilters(newFilters)
}
```

**Update loadItems to use filters:**
```typescript
const loadItems = async () => {
    try {
        if (!window.api || !window.api.getCalendarItems) {
            console.error('[PlanView] window.api.getCalendarItems is not available')
            return
        }
        
        const filters: any = {}
        if (activeDomain !== 'all') filters.domains = [activeDomain]
        if (typeFilters.size > 0 && typeFilters.size < 4) {
            filters.types = Array.from(typeFilters)
        }

        const data = await window.api.getCalendarItems(filters)
        setItems(data || [])
    } catch (error) {
        console.error('[PlanView] Failed to load items:', error)
    }
}
```

**Update filter UI to be interactive:**
```tsx
{[
    { type: 'task', icon: CheckSquare, color: '#3b82f6' },
    { type: 'event', icon: CalendarIcon, color: '#8b5cf6' },
    { type: 'milestone', icon: Flag, color: '#f59e0b' },
    { type: 'habit', icon: Repeat, color: '#10b981' }
].map(({ type, icon: Icon, color }) => (
    <div 
        key={type} 
        style={{
            ...filterItemStyle,
            cursor: 'pointer',
            opacity: typeFilters.has(type as ItemType) ? 1 : 0.3
        }}
        onClick={() => toggleTypeFilter(type as ItemType)}
    >
        <Icon size={16} color={color} style={{ opacity: 0.7 }} />
        <span style={{ fontSize: '0.8125rem', color: '#d1d5db', textTransform: 'capitalize' }}>{type}s</span>
    </div>
))}
```

## Implementation Checklist

- [ ] Add habit end date field to CreateItemModal
- [ ] Update habit submission to include end date in metadata
- [ ] Add checklist UI to CreateItemModal for tasks
- [ ] Add actual end time field for tasks/milestones
- [ ] Calculate and display early/overdue time
- [ ] Add month filter to TableView
- [ ] Add domain color borders to Kanban cards
- [ ] Make sidebar filters interactive with state management
- [ ] Update loadItems to use type filters
- [ ] Test habit rendering stops at end date
- [ ] Test checklist persistence
- [ ] Test performance tracking calculations

## Database Considerations

The `checklist` field will be stored as JSON in the database. Ensure the backend properly serializes/deserializes this field when saving and loading items.

## Performance Notes

- Checklist items use simple array operations
- Date filtering in TableView uses memoization
- Type filters reduce API payload size
- Habit end dates prevent unnecessary RRule calculations
