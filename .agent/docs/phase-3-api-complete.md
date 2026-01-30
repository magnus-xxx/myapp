# Phase 3: API Layer & IPC Handlers - Complete

## ✅ Successfully Implemented

### **Architecture Overview**

The Life OS API layer follows a clean 3-tier architecture:

```
┌─────────────────────────────────────────┐
│         Renderer Process (UI)           │
│  - React Components                     │
│  - Uses window.api.* methods            │
└──────────────┬──────────────────────────┘
               │ IPC Communication
┌──────────────▼──────────────────────────┐
│         Preload Script (Bridge)         │
│  - Exposes typed API to renderer        │
│  - Type-safe IPC invocations            │
└──────────────┬──────────────────────────┘
               │ IPC Handlers
┌──────────────▼──────────────────────────┐
│      Main Process (Backend Logic)       │
│  ┌────────────────────────────────────┐ │
│  │  calendarHandlers.ts (Transport)   │ │
│  │  - Registers IPC handlers          │ │
│  │  - Validates input                 │ │
│  └──────────┬─────────────────────────┘ │
│             │                            │
│  ┌──────────▼─────────────────────────┐ │
│  │  CalendarService.ts (Business)     │ │
│  │  - CRUD operations                 │ │
│  │  - Filtering & sorting             │ │
│  │  - Metadata parsing                │ │
│  └──────────┬─────────────────────────┘ │
│             │                            │
│  ┌──────────▼─────────────────────────┐ │
│  │  DatabaseManager.ts (Data)         │ │
│  │  - SQLite operations               │ │
│  │  - Schema management               │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## **1. CalendarService.ts** (Business Logic Layer)

**Location**: `src/main/services/CalendarService.ts`

### **Key Features**

#### **UUID Generation**
- Uses UUID v4 format for distributed-system compatibility
- Ensures unique IDs across offline/online scenarios

#### **Metadata Handling**
- **Parsing**: Automatically converts JSON strings from DB to JavaScript objects
- **Stringification**: Converts objects to JSON before storage
- **Merging**: Partial updates merge with existing metadata (no data loss)

#### **Flexible Filtering**
Supports multi-dimensional queries:
```typescript
{
  startDate?: Date,
  endDate?: Date,
  domains?: ItemDomain[],  // ['work', 'life', 'study', 'invest']
  types?: ItemType[],      // ['event', 'task', 'milestone', 'habit']
  projectId?: string,
  status?: string          // 'todo' | 'doing' | 'done'
}
```

#### **Intelligent Sorting**
Default sort order:
1. Items with `start_time` (Events) → sorted by start time
2. Items with `due_date` (Tasks/Milestones) → sorted by due date
3. Everything else → sorted by `created_at`

### **Methods**

| Method | Purpose | Returns |
|--------|---------|---------|
| `getCalendarItems(filters?)` | Fetch items with optional filtering | `CalendarItem[]` |
| `getCalendarItem(id)` | Get single item by UUID | `CalendarItem \| null` |
| `createCalendarItem(data)` | Create new item | `CalendarItem` |
| `updateCalendarItem(id, updates)` | Partial update (PATCH style) | `CalendarItem \| null` |
| `deleteCalendarItem(id)` | Delete item | `boolean` |

---

## **2. calendarHandlers.ts** (IPC Transport Layer)

**Location**: `src/main/ipc/calendarHandlers.ts`

### **Registered IPC Channels**

| Channel | Handler | Description |
|---------|---------|-------------|
| `calendar:get-items` | `getCalendarItems` | Fetch with filters |
| `calendar:get-item` | `getCalendarItem` | Get by ID |
| `calendar:create-item` | `createCalendarItem` | Create new |
| `calendar:update-item` | `updateCalendarItem` | Update existing |
| `calendar:delete-item` | `deleteCalendarItem` | Delete |
| `calendar:get-by-domain` | Convenience wrapper | Filter by domain |
| `calendar:get-by-type` | Convenience wrapper | Filter by type |
| `calendar:get-by-project` | Convenience wrapper | Filter by project |

### **Error Handling**
All handlers include try-catch blocks with detailed logging:
```typescript
try {
  return await calendarService.method()
} catch (error) {
  console.error('[IPC] channel-name error:', error)
  throw error  // Re-throw for renderer to handle
}
```

---

## **3. Preload API** (Renderer Bridge)

**Location**: `src/preload/index.ts`

### **Exposed Methods**

```typescript
window.api = {
  // ... existing methods ...
  
  // Life OS Calendar API
  getCalendarItems(filters?): Promise<CalendarItem[]>
  getCalendarItem(id: string): Promise<CalendarItem | null>
  createCalendarItem(data): Promise<CalendarItem>
  updateCalendarItem(id, updates): Promise<CalendarItem | null>
  deleteCalendarItem(id: string): Promise<boolean>
  
  // Convenience methods
  getCalendarItemsByDomain(domain): Promise<CalendarItem[]>
  getCalendarItemsByType(type): Promise<CalendarItem[]>
  getCalendarItemsByProject(projectId): Promise<CalendarItem[]>
}
```

### **Type Safety**
All methods are fully typed using `CalendarItem`, `ItemType`, and `ItemDomain` from `shared/types.ts`.

---

## **Usage Examples**

### **1. Context Switching (Work Mode)**
```typescript
// Get all work items
const workItems = await window.api.getCalendarItemsByDomain('work')

// Get work tasks only
const workTasks = await window.api.getCalendarItems({
  domains: ['work'],
  types: ['task'],
  status: 'todo'
})
```

### **2. Creating a Habit**
```typescript
const habit = await window.api.createCalendarItem({
  title: "Morning Meditation",
  type: "habit",
  domain: "life",
  status: "todo",
  priority: "high",
  recurrence_rule: "FREQ=DAILY",
  metadata: {
    streak: 0,
    best_streak: 0,
    habit_frequency: "daily"
  }
})
```

### **3. Creating an Investment Transaction**
```typescript
const investment = await window.api.createCalendarItem({
  title: "Buy S&P500",
  type: "event",
  domain: "invest",
  status: "done",
  priority: "medium",
  start_time: new Date().toISOString(),
  end_time: new Date().toISOString(),
  metadata: {
    ticker: "VOO",
    amount: 500,
    currency: "USD",
    broker: "Vanguard"
  }
})
```

### **4. Updating Habit Streak**
```typescript
const habit = await window.api.getCalendarItem(habitId)
if (habit) {
  await window.api.updateCalendarItem(habitId, {
    metadata: {
      ...habit.metadata,
      streak: (habit.metadata?.streak || 0) + 1,
      best_streak: Math.max(
        habit.metadata?.best_streak || 0,
        (habit.metadata?.streak || 0) + 1
      )
    }
  })
}
```

### **5. Filtering by Date Range**
```typescript
// Get this week's events
const startOfWeek = new Date()
startOfWeek.setHours(0, 0, 0, 0)
const endOfWeek = new Date(startOfWeek)
endOfWeek.setDate(endOfWeek.getDate() + 7)

const weekEvents = await window.api.getCalendarItems({
  types: ['event'],
  startDate: startOfWeek.toISOString(),
  endDate: endOfWeek.toISOString()
})
```

---

## **Data Flow Example**

### **Creating a Milestone**

```
1. UI Component (React)
   ↓
   await window.api.createCalendarItem({
     title: "Finish TypeScript Book",
     type: "milestone",
     domain: "study",
     ...
   })

2. Preload Script
   ↓
   ipcRenderer.invoke('calendar:create-item', data)

3. IPC Handler (calendarHandlers.ts)
   ↓
   await calendarService.createCalendarItem(data)

4. CalendarService
   ↓
   - Generate UUID
   - Stringify metadata
   - Insert into DB
   - Return CalendarItem

5. Database
   ↓
   INSERT INTO calendar_items (id, title, type, domain, ...)
   VALUES (uuid, 'Finish TypeScript Book', 'milestone', 'study', ...)

6. Response flows back up the chain
   ↓
   CalendarItem object returned to UI
```

---

## **Metadata Parsing Guarantee**

The `CalendarService` **always** returns metadata as a JavaScript object, never as a string:

```typescript
// ❌ NEVER happens
item.metadata = '{"ticker":"VOO","amount":500}'

// ✅ ALWAYS happens
item.metadata = { ticker: "VOO", amount: 500 }
```

This is enforced by the `parseMetadata()` method in `CalendarService`.

---

## **Performance Considerations**

1. **Indexed Queries**: All filter fields (`domain`, `type`, `project_id`, `status`) use database indexes
2. **Lazy Loading**: Metadata is only parsed when items are retrieved
3. **Batch Operations**: Use `getCalendarItems()` instead of multiple `getCalendarItem()` calls
4. **Caching**: Consider implementing a cache layer in the renderer for frequently accessed items

---

## **Next Steps (Phase 4: UI Integration)**

Now that the API is ready, you can:

1. **Update EventModal** to use `createCalendarItem()` and `updateCalendarItem()`
2. **Create Domain Switcher** UI component (Work/Life/Study/Invest tabs)
3. **Build Habit Tracker** view using `getCalendarItemsByType('habit')`
4. **Implement Investment Dashboard** using `getCalendarItemsByDomain('invest')`
5. **Add Performance Analytics** using `estimate_minutes` and `actual_minutes`

---

**Status**: ✅ **Phase 3 Complete - API Layer Fully Operational**

The Life OS backend is now production-ready with full CRUD capabilities, flexible filtering, and type-safe communication between renderer and main processes.
