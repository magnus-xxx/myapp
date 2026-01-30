# Polymorphic Item System - Design Documentation

## Overview
The Polymorphic Item System unifies Events, Tasks, Milestones, and Habits into a single flexible data structure (`CalendarItem`), enabling powerful cross-cutting features while maintaining type safety.

## Type Definitions

### Core Types
```typescript
export type ItemType = 'event' | 'task' | 'milestone' | 'habit'
export type ItemDomain = 'work' | 'life' | 'study' | 'invest'
export type ItemStatus = 'todo' | 'doing' | 'done'
export type ItemPriority = 'low' | 'medium' | 'high'
```

### CalendarItem Interface
```typescript
interface CalendarItem {
  // Identity
  id?: number
  title: string
  description?: string
  type: ItemType
  
  // Organization
  domain: ItemDomain      // Replaces 'category' with life domains
  status: ItemStatus      // Unified workflow status
  priority: ItemPriority  // Importance level
  
  // Time (Flexible based on type)
  start_time?: string     // For Events
  end_time?: string       // For Events
  due_date?: string       // For Tasks/Milestones
  
  // Performance Tracking
  estimate_minutes?: number
  actual_minutes?: number
  
  // Extensible Metadata
  metadata?: ItemMetadata
  
  // Visual
  color?: string
}
```

### Metadata Structure
```typescript
interface ItemMetadata {
  // Events
  location?: string
  meet_link?: string
  attendees?: string[]
  
  // Projects
  linked_project_id?: string
  
  // Milestones
  target_value?: number
  current_value?: number
  
  // Habits
  habit_streak?: number
  habit_frequency?: 'daily' | 'weekly' | 'monthly'
}
```

## Key Design Decisions

### 1. **Domain-Based Organization**
Replaced generic "categories" with life domains:
- **Work**: Professional tasks, meetings, projects
- **Life**: Personal errands, family events, social activities
- **Study**: Learning, courses, skill development
- **Invest**: Financial planning, investment tracking, wealth building

### 2. **Flexible Time Fields**
Different item types use different time fields:
- **Events**: `start_time` + `end_time` (time blocks)
- **Tasks**: `due_date` (deadline)
- **Milestones**: `due_date` (target date)
- **Habits**: No specific time (recurring patterns)

### 3. **Performance Metrics**
Track productivity with:
- `estimate_minutes`: Planned effort
- `actual_minutes`: Real time spent
- Enables velocity tracking and better planning

### 4. **Extensible Metadata**
JSON-based metadata allows type-specific data without schema changes:
- Events can have locations and attendees
- Milestones can track progress percentages
- Habits can maintain streaks

## Migration Strategy

### Phase 1: Type Definitions ✅
- Add new interfaces to `shared/types.ts`
- Maintain backward compatibility with existing `Event`, `Task`, `Milestone` types

### Phase 2: Database Schema (Next)
- Create new `calendar_items` table
- Add migration to convert existing data
- Keep old tables for rollback safety

### Phase 3: API Layer (Next)
- Add new IPC handlers for `CalendarItem` CRUD
- Maintain existing handlers for backward compatibility

### Phase 4: UI Components (Next)
- Update `EventModal` to support all item types
- Enhance `KanbanView` with domain filtering
- Add performance tracking UI

## Benefits

### For Users
1. **Unified View**: See all commitments (events, tasks, milestones) in one place
2. **Better Planning**: Track estimates vs actuals across all work
3. **Domain Focus**: Filter by life area (work/life balance insights)
4. **Habit Tracking**: Build streaks and maintain consistency

### For Developers
1. **Single Source of Truth**: One data model for all calendar items
2. **Type Safety**: TypeScript ensures correct usage
3. **Extensibility**: Add new item types without breaking changes
4. **Performance**: Fewer tables, simpler queries

## Example Usage

### Creating Different Item Types

```typescript
// Event
const meeting: CalendarItem = {
  title: "Client Presentation",
  type: "event",
  domain: "work",
  status: "todo",
  priority: "high",
  start_time: "2026-01-08T14:00:00Z",
  end_time: "2026-01-08T15:00:00Z",
  estimate_minutes: 60,
  metadata: {
    location: "Conference Room A",
    meet_link: "https://meet.google.com/abc-defg-hij",
    attendees: ["john@company.com", "jane@company.com"]
  }
}

// Task
const task: CalendarItem = {
  title: "Complete Q1 Report",
  type: "task",
  domain: "work",
  status: "doing",
  priority: "high",
  due_date: "2026-01-10T17:00:00Z",
  estimate_minutes: 180,
  metadata: {
    linked_project_id: "project-123"
  }
}

// Milestone
const milestone: CalendarItem = {
  title: "Launch MVP",
  type: "milestone",
  domain: "work",
  status: "doing",
  priority: "high",
  due_date: "2026-02-01T00:00:00Z",
  metadata: {
    target_value: 100,
    current_value: 65
  }
}

// Habit
const habit: CalendarItem = {
  title: "Morning Exercise",
  type: "habit",
  domain: "life",
  status: "todo",
  priority: "medium",
  estimate_minutes: 30,
  metadata: {
    habit_frequency: "daily",
    habit_streak: 12
  }
}
```

## Next Steps

1. **Database Migration**: Create `calendar_items` table with proper schema
2. **Data Conversion**: Migrate existing events/tasks to new format
3. **API Implementation**: Add CRUD operations for `CalendarItem`
4. **UI Updates**: Enhance modals and views to support all types
5. **Analytics**: Build insights dashboard using performance metrics

## Backward Compatibility

The existing `Event`, `Task`, and `Milestone` interfaces remain unchanged. The new `CalendarItem` system runs in parallel, allowing gradual migration without breaking existing functionality.
