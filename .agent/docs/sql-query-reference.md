# Calendar Items SQL Query Reference

## Common Queries for Life OS

### 1. **Domain-Based Views**

```sql
-- Get all work items
SELECT * FROM calendar_items WHERE domain = 'work' ORDER BY start_time DESC

-- Get all life items
SELECT * FROM calendar_items WHERE domain = 'life' ORDER BY due_date ASC

-- Get all study items
SELECT * FROM calendar_items WHERE domain = 'study' ORDER BY priority DESC

-- Get all investment tracking items
SELECT * FROM calendar_items WHERE domain = 'invest' ORDER BY created_at DESC
```

### 2. **Type-Specific Queries**

```sql
-- Get all events (time-blocked activities)
SELECT * FROM calendar_items 
WHERE type = 'event' 
ORDER BY start_time ASC

-- Get all tasks (actionable items)
SELECT * FROM calendar_items 
WHERE type = 'task' AND status != 'done'
ORDER BY due_date ASC

-- Get all milestones (goals)
SELECT * FROM calendar_items 
WHERE type = 'milestone' AND status != 'done'
ORDER BY due_date ASC

-- Get all habits (recurring activities)
SELECT * FROM calendar_items 
WHERE type = 'habit'
ORDER BY title ASC
```

### 3. **Status-Based Workflows**

```sql
-- Kanban: To Do column
SELECT * FROM calendar_items 
WHERE status = 'todo' 
ORDER BY priority DESC, due_date ASC

-- Kanban: Doing column
SELECT * FROM calendar_items 
WHERE status = 'doing' 
ORDER BY start_time ASC

-- Kanban: Done column
SELECT * FROM calendar_items 
WHERE status = 'done' 
ORDER BY updated_at DESC
LIMIT 50
```

### 4. **Priority-Based Views**

```sql
-- High priority items across all domains
SELECT * FROM calendar_items 
WHERE priority = 'high' AND status != 'done'
ORDER BY due_date ASC

-- Urgent work items
SELECT * FROM calendar_items 
WHERE domain = 'work' 
  AND priority = 'high' 
  AND status != 'done'
ORDER BY due_date ASC
```

### 5. **Time-Based Queries**

```sql
-- Today's events
SELECT * FROM calendar_items 
WHERE type = 'event' 
  AND date(start_time) = date('now')
ORDER BY start_time ASC

-- This week's tasks
SELECT * FROM calendar_items 
WHERE type = 'task' 
  AND date(due_date) BETWEEN date('now') AND date('now', '+7 days')
ORDER BY due_date ASC

-- Overdue items
SELECT * FROM calendar_items 
WHERE status != 'done' 
  AND (
    (type = 'event' AND datetime(start_time) < datetime('now'))
    OR (type IN ('task', 'milestone') AND date(due_date) < date('now'))
  )
ORDER BY due_date ASC

-- Upcoming milestones (next 30 days)
SELECT * FROM calendar_items 
WHERE type = 'milestone' 
  AND status != 'done'
  AND date(due_date) BETWEEN date('now') AND date('now', '+30 days')
ORDER BY due_date ASC
```

### 6. **Performance Analytics**

```sql
-- Items with time estimates
SELECT 
  domain,
  type,
  COUNT(*) as total_items,
  SUM(estimate_minutes) as total_estimated,
  SUM(actual_minutes) as total_actual,
  AVG(CAST(actual_minutes AS FLOAT) / NULLIF(estimate_minutes, 0)) as accuracy_ratio
FROM calendar_items 
WHERE estimate_minutes IS NOT NULL
GROUP BY domain, type

-- Completed items this week
SELECT 
  domain,
  COUNT(*) as completed_count,
  SUM(actual_minutes) as total_time_spent
FROM calendar_items 
WHERE status = 'done' 
  AND date(updated_at) >= date('now', '-7 days')
GROUP BY domain

-- Productivity by domain (completed vs total)
SELECT 
  domain,
  COUNT(*) as total_items,
  SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
  ROUND(100.0 * SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate
FROM calendar_items 
GROUP BY domain
```

### 7. **Metadata Queries**

```sql
-- Events with meeting links
SELECT 
  title,
  start_time,
  json_extract(metadata, '$.meet_link') as meeting_link
FROM calendar_items 
WHERE type = 'event' 
  AND json_extract(metadata, '$.meet_link') IS NOT NULL
ORDER BY start_time ASC

-- Tasks with subtasks
SELECT 
  title,
  json_extract(metadata, '$.subtasks') as subtasks
FROM calendar_items 
WHERE type = 'task' 
  AND json_extract(metadata, '$.subtasks') != '[]'

-- Milestones with progress tracking
SELECT 
  title,
  json_extract(metadata, '$.current_value') as current_progress,
  json_extract(metadata, '$.target_value') as target,
  ROUND(100.0 * json_extract(metadata, '$.current_value') / json_extract(metadata, '$.target_value'), 2) as percent_complete
FROM calendar_items 
WHERE type = 'milestone'
ORDER BY percent_complete DESC

-- Habits with streaks
SELECT 
  title,
  json_extract(metadata, '$.habit_streak') as current_streak,
  json_extract(metadata, '$.habit_frequency') as frequency
FROM calendar_items 
WHERE type = 'habit'
ORDER BY CAST(json_extract(metadata, '$.habit_streak') AS INTEGER) DESC
```

### 8. **Project-Based Views**

```sql
-- All items for a specific project
SELECT * FROM calendar_items 
WHERE project_id = 'project-uuid-here'
ORDER BY type, due_date ASC

-- Project progress summary
SELECT 
  project_id,
  COUNT(*) as total_items,
  SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
  SUM(estimate_minutes) as estimated_hours
FROM calendar_items 
WHERE project_id IS NOT NULL
GROUP BY project_id
```

### 9. **Context Switching Queries**

```sql
-- Switch to Work mode (show only work items due today/this week)
SELECT * FROM calendar_items 
WHERE domain = 'work' 
  AND status != 'done'
  AND (
    (type = 'event' AND date(start_time) = date('now'))
    OR (type IN ('task', 'milestone') AND date(due_date) <= date('now', '+7 days'))
  )
ORDER BY 
  CASE type 
    WHEN 'event' THEN 1 
    WHEN 'task' THEN 2 
    WHEN 'milestone' THEN 3 
  END,
  start_time ASC,
  due_date ASC

-- Switch to Life mode (personal items)
SELECT * FROM calendar_items 
WHERE domain = 'life' 
  AND status != 'done'
ORDER BY priority DESC, due_date ASC

-- Switch to Study mode (learning items)
SELECT * FROM calendar_items 
WHERE domain = 'study'
ORDER BY status ASC, due_date ASC

-- Switch to Invest mode (financial tracking)
SELECT * FROM calendar_items 
WHERE domain = 'invest'
ORDER BY updated_at DESC
```

### 10. **Recurrence Queries**

```sql
-- All recurring items
SELECT * FROM calendar_items 
WHERE recurrence_rule IS NOT NULL
ORDER BY domain, title

-- Daily habits
SELECT * FROM calendar_items 
WHERE type = 'habit' 
  AND json_extract(metadata, '$.habit_frequency') = 'daily'

-- Weekly recurring tasks
SELECT * FROM calendar_items 
WHERE recurrence_rule LIKE '%FREQ=WEEKLY%'
```

## Advanced Analytics

### Weekly Review Query
```sql
SELECT 
  domain,
  type,
  COUNT(*) as items,
  SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
  SUM(actual_minutes) as time_spent,
  ROUND(AVG(CASE 
    WHEN estimate_minutes > 0 THEN 
      100.0 * actual_minutes / estimate_minutes 
    ELSE NULL 
  END), 2) as estimate_accuracy
FROM calendar_items 
WHERE date(created_at) >= date('now', '-7 days')
GROUP BY domain, type
ORDER BY domain, type
```

### Monthly Domain Balance
```sql
SELECT 
  domain,
  COUNT(*) as total_items,
  SUM(actual_minutes) / 60.0 as hours_spent,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM calendar_items WHERE date(created_at) >= date('now', '-30 days')), 2) as percentage
FROM calendar_items 
WHERE date(created_at) >= date('now', '-30 days')
GROUP BY domain
ORDER BY hours_spent DESC
```

---

**Pro Tip**: Use these queries in your DatabaseManager methods to build powerful views and analytics features!
