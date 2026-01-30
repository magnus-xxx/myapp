/**
 * Migrate legacy data to polymorphic calendar_items table
 * ETL Process: Extract from events/tasks/milestones → Transform → Load into calendar_items
 */
private migrateToCalendarItems(): void {
  if (!this.db) return

  try {
    // Check if migration has already been run
    const checkMigration = this.db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='calendar_items'
    `)
    
    if (checkMigration.length === 0) {
      console.log('[DatabaseManager] calendar_items table does not exist yet, skipping migration')
      return
    }

    // Check if migration marker exists
    const migrationCheck = this.db.exec(`
      SELECT value FROM settings WHERE key = 'calendar_items_migration_v1'
    `)
    
    if (migrationCheck.length > 0 && migrationCheck[0].values.length > 0) {
      console.log('[DatabaseManager] Calendar items migration already completed')
      return
    }

    console.log('[DatabaseManager] Starting calendar_items migration...')
    
    let migratedCount = 0

    // ===== MIGRATE EVENTS =====
    const eventsResult = this.db.exec('SELECT * FROM events')
    if (eventsResult.length > 0 && eventsResult[0].values.length > 0) {
      console.log(`[DatabaseManager] Migrating ${eventsResult[0].values.length} events...`)
      
      eventsResult[0].values.forEach((row) => {
        const id = this.generateUUID()
        const title = row[1] as string
        const description = row[2] as string || ''
        const start_time = row[3] as string
        const end_time = row[4] as string
        const category = row[5] as string || 'general'
        const color = row[6] as string || '#3b82f6'
        const type = row[9] as string || 'event'
        const status = row[10] as string || 'todo'
        const priority = row[11] as string || 'medium'
        
        // Intelligent domain mapping based on category
        const domain = this.mapCategoryToDomain(category)
        
        // Build metadata
        const metadata = JSON.stringify({
          legacy_category: category,
          migrated_from: 'events',
          original_id: row[0]
        })

        this.db!.run(`
          INSERT INTO calendar_items (
            id, title, description, type, domain, status, priority,
            start_time, end_time, color, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, title, description, 'event', domain, status, priority,
          start_time, end_time, color, metadata,
          row[7] || new Date().toISOString(),
          row[8] || new Date().toISOString()
        ])
        
        migratedCount++
      })
    }

    // ===== MIGRATE TASKS =====
    const tasksResult = this.db.exec('SELECT * FROM tasks')
    if (tasksResult.length > 0 && tasksResult[0].values.length > 0) {
      console.log(`[DatabaseManager] Migrating ${tasksResult[0].values.length} tasks...`)
      
      tasksResult[0].values.forEach((row) => {
        const id = this.generateUUID()
        const title = row[1] as string
        const description = row[2] as string || ''
        const status = this.mapTaskStatus(row[4] as string)
        const priority = row[5] as string || 'medium'
        const due_date = row[9] as string
        const client_project = row[7] as string
        
        // Map to domain based on client_project or default to work
        const domain = client_project ? 'work' : 'life'
        
        // Build metadata with task-specific fields
        const metadata = JSON.stringify({
          eisenhower_quadrant: row[6],
          client_project: client_project,
          milestone_id: row[8],
          subtasks: row[11] ? JSON.parse(row[11] as string) : [],
          tags: row[13] ? JSON.parse(row[13] as string) : [],
          migrated_from: 'tasks',
          original_id: row[0]
        })

        this.db!.run(`
          INSERT INTO calendar_items (
            id, title, description, type, domain, status, priority,
            due_date, recurrence_rule, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, title, description, 'task', domain, status, priority,
          due_date, row[12] || null, metadata,
          row[14] || new Date().toISOString(),
          row[15] || new Date().toISOString()
        ])
        
        migratedCount++
      })
    }

    // ===== MIGRATE MILESTONES =====
    const milestonesResult = this.db.exec('SELECT * FROM milestones')
    if (milestonesResult.length > 0 && milestonesResult[0].values.length > 0) {
      console.log(`[DatabaseManager] Migrating ${milestonesResult[0].values.length} milestones...`)
      
      milestonesResult[0].values.forEach((row) => {
        const id = this.generateUUID()
        const title = row[1] as string
        const description = row[2] as string || ''
        const target_date = row[3] as string
        const completed = row[4] as number
        const color = row[5] as string || '#FFFFFF'
        
        // Milestones default to 'study' or 'invest' domain
        const domain = this.inferMilestoneDomain(title, description)
        const status = completed ? 'done' : 'doing'
        
        // Build metadata with milestone-specific fields
        const metadata = JSON.stringify({
          target_value: 100,
          current_value: completed ? 100 : 0,
          migrated_from: 'milestones',
          original_id: row[0]
        })

        this.db!.run(`
          INSERT INTO calendar_items (
            id, title, description, type, domain, status, priority,
            due_date, color, metadata, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, title, description, 'milestone', domain, status, 'high',
          target_date, color, metadata,
          row[6] || new Date().toISOString(),
          row[7] || new Date().toISOString()
        ])
        
        migratedCount++
      })
    }

    // Mark migration as complete
    this.db.run(`
      INSERT OR REPLACE INTO settings (key, value) 
      VALUES ('calendar_items_migration_v1', 'completed')
    `)

    console.log(`[DatabaseManager] ✅ Migration completed! Migrated ${migratedCount} items to calendar_items`)
    
  } catch (error) {
    console.error('[DatabaseManager] Calendar items migration error:', error)
    console.error('[DatabaseManager] ⚠️  Migration failed - legacy tables remain intact for rollback')
  }
}

/**
 * Generate UUID v4 for calendar items
 */
private generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Map legacy category to new domain system
 */
private mapCategoryToDomain(category: string): 'work' | 'life' | 'study' | 'invest' {
  const cat = category.toLowerCase()
  
  if (cat.includes('work') || cat.includes('meeting') || cat.includes('client')) {
    return 'work'
  }
  if (cat.includes('study') || cat.includes('learn') || cat.includes('course')) {
    return 'study'
  }
  if (cat.includes('invest') || cat.includes('finance') || cat.includes('money')) {
    return 'invest'
  }
  
  return 'life' // Default to life domain
}

/**
 * Map task status to new status system
 */
private mapTaskStatus(status: string): 'todo' | 'doing' | 'done' {
  if (status === 'in_progress') return 'doing'
  if (status === 'done') return 'done'
  return 'todo'
}

/**
 * Infer milestone domain from title/description
 */
private inferMilestoneDomain(title: string, description: string): 'work' | 'life' | 'study' | 'invest' {
  const text = (title + ' ' + description).toLowerCase()
  
  if (text.includes('learn') || text.includes('course') || text.includes('skill')) {
    return 'study'
  }
  if (text.includes('invest') || text.includes('portfolio') || text.includes('financial')) {
    return 'invest'
  }
  if (text.includes('project') || text.includes('launch') || text.includes('deliver')) {
    return 'work'
  }
  
  return 'life'
}
