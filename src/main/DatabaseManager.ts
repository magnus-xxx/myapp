import initSqlJs, { Database } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

import { Task, Milestone, Event, Holiday, Finance, Asset, Setting, HubService, CalendarSource } from '../shared/types'

/**
 * DatabaseManager - Handles all SQLite database operations
 * Uses sql.js (WebAssembly-based SQLite) for cross-platform compatibility
 */
export class DatabaseManager {
  private db: Database | null = null
  private dbPath: string
  private initialized: boolean = false

  constructor() {
    // Store database in user data directory
    const userDataPath = app.getPath('userData')
    this.dbPath = join(userDataPath, 'magnus.db')
    console.log('[DatabaseManager] Database path:', this.dbPath)
  }

  /**
   * Initialize the database connection and create tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize sql.js
      const SQL = await initSqlJs()

      // Ensure directory exists
      const dir = app.getPath('userData')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      // Load existing database or create new one
      if (existsSync(this.dbPath)) {
        const buffer = readFileSync(this.dbPath)
        this.db = new SQL.Database(buffer)
        console.log('[DatabaseManager] Loaded existing database')
      } else {
        this.db = new SQL.Database()
        console.log('[DatabaseManager] Created new database')
      }

      // Create tables
      this.createTables()
      
      // Run migrations
      this.migrateForProductivity()
      this.migrateToCalendarItems()
      this.migrateForGoogleSync()
      
      this.save()

      this.initialized = true
      console.log('[DatabaseManager] Database initialized successfully')
    } catch (error) {
      console.error('[DatabaseManager] Failed to initialize database:', error)
      throw error
    }
  }

  /**
   * Save database to disk
   */
  private save(): void {
    if (!this.db) return
    const data = this.db.export()
    writeFileSync(this.dbPath, data)
  }

  /**
   * Migrate database schema for productivity features
   */
  private migrateForProductivity(): void {
    if (!this.db) return

    try {
      // Check if tasks table has 'status' column
      const tasksColumns = this.db.exec("PRAGMA table_info(tasks)")[0]?.values.map(col => col[1] as string) || []
      
      if (!tasksColumns.includes('status')) {
        console.log('[DatabaseManager] Migrating tasks table...')
        this.db.run("ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done'))")
        this.db.run("ALTER TABLE tasks ADD COLUMN eisenhower_quadrant TEXT CHECK(eisenhower_quadrant IN ('urgent_important', 'not_urgent_important', 'urgent_not_important', 'not_urgent_not_important'))")
        this.db.run("ALTER TABLE tasks ADD COLUMN client_project TEXT")
        this.db.run("ALTER TABLE tasks ADD COLUMN milestone_id INTEGER")
        this.db.run("ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0")
      }

      // Add new task enhancement fields
      if (!tasksColumns.includes('subtasks')) {
        console.log('[DatabaseManager] Adding subtasks, recurrence, and tags to tasks table...')
        this.db.run("ALTER TABLE tasks ADD COLUMN subtasks TEXT") // JSON string
        this.db.run("ALTER TABLE tasks ADD COLUMN recurrence TEXT") // 'daily' | 'weekly' | 'monthly'
        this.db.run("ALTER TABLE tasks ADD COLUMN tags TEXT") // JSON string of tag names
      }

      // Check if events table has new category/color columns
      const eventsColumns = this.db.exec("PRAGMA table_info(events)")[0]?.values.map(col => col[1] as string) || []
      if (!eventsColumns.includes('category')) {
        console.log('[DatabaseManager] Migrating events table to add category and color...')
        this.db.run("ALTER TABLE events ADD COLUMN category TEXT DEFAULT 'general'")
        this.db.run("ALTER TABLE events ADD COLUMN color TEXT DEFAULT '#3b82f6'")
      }

      // Check if events table has new columns type, status, priority
      if (!eventsColumns.includes('type')) {
        console.log('[DatabaseManager] Adding type, status, priority to events table...')
        this.db.run("ALTER TABLE events ADD COLUMN type TEXT DEFAULT 'event'")
        this.db.run("ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'todo'")
        this.db.run("ALTER TABLE events ADD COLUMN priority TEXT DEFAULT 'medium'")
      }

      console.log('[DatabaseManager] Migrations completed')
    } catch (error) {
      console.error('[DatabaseManager] Migration error:', error)
    }
  }

  /**
   * Create all necessary database tables
   */
  private createTables(): void {
    if (!this.db) return

    // Tasks table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        eisenhower_quadrant TEXT CHECK(eisenhower_quadrant IN ('urgent_important', 'not_urgent_important', 'urgent_not_important', 'not_urgent_not_important')),
        client_project TEXT,
        milestone_id INTEGER,
        due_date TEXT,
        order_index INTEGER DEFAULT 0,
        subtasks TEXT,
        recurrence TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Milestones table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        target_date TEXT,
        completed INTEGER DEFAULT 0,
        color TEXT DEFAULT '#FFFFFF',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Events table (Local calendar events)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        color TEXT DEFAULT '#3b82f6',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'event',
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium'
      )
    `)

    // Projects table (needed for foreign key in calendar_items)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // ===== POLYMORPHIC CALENDAR ITEMS TABLE (Life OS Core) =====
    this.db.run(`
      CREATE TABLE IF NOT EXISTS calendar_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        
        -- Polymorphic Type System
        type TEXT NOT NULL CHECK(type IN ('event', 'task', 'milestone', 'habit')),
        domain TEXT NOT NULL CHECK(domain IN ('work', 'life', 'study', 'invest')),
        status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'doing', 'done')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        
        -- Project/Context Linking
        project_id TEXT,
        
        -- Flexible Time Fields
        start_time TEXT,
        end_time TEXT,
        due_date TEXT,
        
        -- Performance Tracking
        estimate_minutes INTEGER,
        actual_minutes INTEGER,
        
        -- Recurrence Support (RRULE standard)
        recurrence_rule TEXT,
        
        -- Extensible Metadata (JSON)
        metadata TEXT DEFAULT '{}',
        
        -- Visual
        color TEXT,
        
        -- System Fields
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes for Performance
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      )
    `)
    
    // Create indexes for fast querying
    this.db.run('CREATE INDEX IF NOT EXISTS idx_calendar_items_domain ON calendar_items(domain)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_calendar_items_type ON calendar_items(type)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_calendar_items_project ON calendar_items(project_id)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_calendar_items_status ON calendar_items(status)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_calendar_items_due_date ON calendar_items(due_date)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_calendar_items_start_time ON calendar_items(start_time)')

    // Holidays table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS holidays (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        country_code TEXT DEFAULT 'US',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Finances table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS finances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        asset_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Assets table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'USD',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Settings table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL
      )
    `)

    // Hub Services table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS hub_services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        icon TEXT,
        color TEXT DEFAULT '#FFFFFF',
        position INTEGER DEFAULT 0,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Calendar Sources table (for iCal integration)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS calendar_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        color TEXT DEFAULT '#FFFFFF',
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('[DatabaseManager] Tables created successfully')
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.save()
      this.db.close()
      this.db = null
      this.initialized = false
      console.log('[DatabaseManager] Database closed')
    }
  }

  /**
   * Get the database file path
   */
  getDbPath(): string {
    return this.dbPath
  }

  // ----- TASKS -----

  getTasks(): Task[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM tasks ORDER BY created_at DESC')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      title: row[1] as string,
      description: row[2] as string,
      completed: row[3] === 1,
      status: row[4] as 'todo' | 'in_progress' | 'done',
      priority: row[5] as 'low' | 'medium' | 'high',
      eisenhower_quadrant: row[6] as any,
      client_project: row[7] as string | null,
      milestone_id: row[8] as number | null,
      due_date: row[9] as string | null,
      order_index: row[10] as number,
      subtasks: row[11] as string | null,
      recurrence: row[12] as string | null,
      tags: row[13] as string | null,
      created_at: row[14] as string,
      updated_at: row[15] as string
    }))
  }

  getTask(id: number): Task | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT * FROM tasks WHERE id = ?', [id])
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      title: row[1] as string,
      description: row[2] as string,
      completed: row[3] === 1,
      status: row[4] as 'todo' | 'in_progress' | 'done',
      priority: row[5] as 'low' | 'medium' | 'high',
      eisenhower_quadrant: row[6] as any,
      client_project: row[7] as string | null,
      milestone_id: row[8] as number | null,
      due_date: row[9] as string | null,
      order_index: row[10] as number,
      subtasks: row[11] as string | null,
      recurrence: row[12] as string | null,
      tags: row[13] as string | null,
      created_at: row[14] as string,
      updated_at: row[15] as string
    }
  }

  addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
    if (!this.db) throw new Error('Database not initialized')
    
    this.db.run(
      `INSERT INTO tasks (title, description, completed, status, priority, eisenhower_quadrant, client_project, milestone_id, due_date, order_index, subtasks, recurrence, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.title,
        task.description || '',
        task.completed ? 1 : 0,
        task.status || 'todo',
        task.priority || 'medium',
        task.eisenhower_quadrant || null,
        task.client_project || null,
        task.milestone_id || null,
        task.due_date || null,
        task.order_index || 0,
        task.subtasks || null,
        task.recurrence || null,
        task.tags || null
      ]
    )
    
    this.save()
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    return this.getTask(id)!
  }

  updateTask(id: number, updates: Partial<Task>): Task | null {
    if (!this.db) return null
    
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?')
      values.push(updates.completed ? 1 : 0)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?')
      values.push(updates.priority)
    }
    if (updates.eisenhower_quadrant !== undefined) {
      fields.push('eisenhower_quadrant = ?')
      values.push(updates.eisenhower_quadrant)
    }
    if (updates.client_project !== undefined) {
      fields.push('client_project = ?')
      values.push(updates.client_project)
    }
    if (updates.milestone_id !== undefined) {
      fields.push('milestone_id = ?')
      values.push(updates.milestone_id)
    }
    if (updates.due_date !== undefined) {
      fields.push('due_date = ?')
      values.push(updates.due_date)
    }
    if (updates.order_index !== undefined) {
      fields.push('order_index = ?')
      values.push(updates.order_index)
    }
    if (updates.subtasks !== undefined) {
      fields.push('subtasks = ?')
      values.push(updates.subtasks)
    }
    if (updates.recurrence !== undefined) {
      fields.push('recurrence = ?')
      values.push(updates.recurrence)
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?')
      values.push(updates.tags)
    }
    
    if (fields.length === 0) return this.getTask(id)
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    this.db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    
    return this.getTask(id)
  }

  deleteTask(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM tasks WHERE id = ?', [id])
    this.save()
    return true
  }

  // ----- MILESTONES -----

  getMilestones(): Milestone[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM milestones ORDER BY created_at DESC')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      title: row[1] as string,
      description: row[2] as string,
      target_date: row[3] as string | null,
      completed: row[4] === 1,
      color: row[5] as string,
      created_at: row[6] as string,
      updated_at: row[7] as string
    }))
  }

  getMilestone(id: number): Milestone | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT * FROM milestones WHERE id = ?', [id])
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      title: row[1] as string,
      description: row[2] as string,
      target_date: row[3] as string | null,
      completed: row[4] === 1,
      color: row[5] as string,
      created_at: row[6] as string,
      updated_at: row[7] as string
    }
  }

  addMilestone(milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>): Milestone {
    if (!this.db) throw new Error('Database not initialized')
    
    this.db.run(
      `INSERT INTO milestones (title, description, target_date, completed, color)
       VALUES (?, ?, ?, ?, ?)`,
      [
        milestone.title,
        milestone.description || '',
        milestone.target_date || null,
        milestone.completed ? 1 : 0,
        milestone.color || '#FFFFFF'
      ]
    )
    
    this.save()
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    return this.getMilestone(id)!
  }

  updateMilestone(id: number, updates: Partial<Milestone>): Milestone | null {
    if (!this.db) return null
    
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.target_date !== undefined) {
      fields.push('target_date = ?')
      values.push(updates.target_date)
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?')
      values.push(updates.completed ? 1 : 0)
    }
    if (updates.color !== undefined) {
      fields.push('color = ?')
      values.push(updates.color)
    }
    
    if (fields.length === 0) return this.getMilestone(id)
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    this.db.run(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    
    return this.getMilestone(id)
  }

  deleteMilestone(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM milestones WHERE id = ?', [id])
    this.save()
    return true
  }

  // ----- EVENTS -----

  getEvents(): Event[] {
    if (!this.db) return []
    // Use explicit column selection to ensure order
    const result = this.db.exec(`
      SELECT id, title, description, start_time, end_time, category, color, type, status, priority, created_at, updated_at 
      FROM events 
      ORDER BY start_time DESC
    `)
    
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      title: row[1] as string,
      description: row[2] as string,
      start_time: row[3] as string,
      end_time: row[4] as string,
      category: row[5] as string,
      color: row[6] as string,
      type: row[7] as any,
      status: row[8] as any,
      priority: row[9] as any,
      created_at: row[10] as string,
      updated_at: row[11] as string
    }))
  }

  getEvent(id: number): Event | null {
    if (!this.db) return null
    
    // Use string concatenation for ID to ensure reliability with sql.js
    // Use explicit column selection
    const result = this.db.exec(`
      SELECT id, title, description, start_time, end_time, category, color, type, status, priority, created_at, updated_at 
      FROM events 
      WHERE id = ` + id)
    
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      title: row[1] as string,
      description: row[2] as string,
      start_time: row[3] as string,
      end_time: row[4] as string,
      category: row[5] as string,
      color: row[6] as string,
      type: row[7] as any,
      status: row[8] as any,
      priority: row[9] as any,
      created_at: row[10] as string,
      updated_at: row[11] as string
    }
  }

  addEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event {
    if (!this.db) throw new Error('Database not initialized')
    
    console.log('[DatabaseManager] Adding event:', event)
    
    this.db.run(
      `INSERT INTO events (title, description, start_time, end_time, category, color, type, status, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.title,
        event.description || '',
        event.start_time,
        event.end_time,
        event.category || 'general',
        event.color || '#3b82f6',
        event.type || 'event',
        event.status || 'todo',
        event.priority || 'medium'
      ]
    )
    
    this.save()
    console.log('[DatabaseManager] Event saved to disk')
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    console.log('[DatabaseManager] Last insert ID:', id)
    
    // Construct the event object directly from the data we just inserted
    const now = new Date().toISOString()
    const createdEvent: Event = {
      id,
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      category: event.category || 'general',
      color: event.color || '#3b82f6',
      type: event.type || 'event',
      status: event.status || 'todo',
      priority: event.priority || 'medium',
      created_at: now,
      updated_at: now
    }
    
    console.log('[DatabaseManager] Created event:', createdEvent)
    return createdEvent
  }

  updateEvent(id: number, updates: Partial<Event>): Event | null {
    if (!this.db) return null
    
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.start_time !== undefined) {
      fields.push('start_time = ?')
      values.push(updates.start_time)
    }
    if (updates.end_time !== undefined) {
      fields.push('end_time = ?')
      values.push(updates.end_time)
    }
    if (updates.category !== undefined) {
      fields.push('category = ?')
      values.push(updates.category)
    }
    if (updates.color !== undefined) {
      fields.push('color = ?')
      values.push(updates.color)
    }
    
    if (fields.length === 0) return this.getEvent(id)
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    this.db.run(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    console.log('[DatabaseManager] Event updated and saved to disk')
    
    // Construct the updated event object manually to avoid getEvent issues
    // We need the data that wasn't updated, but we can't reliably get it if getEvent is broken.
    // However, since we are in a "fix it now" mode, let's try to get the existing event BEFORE update?
    // Too expensive to fail. 
    // Best effort: Return what we have plus current timestamp. 
    // Ideally the frontend refreshes anyway.
    
    // Actually, let's try to use a robust query to get the updated row.
    try {
       const result = this.db.exec('SELECT * FROM events WHERE id = ' + id) // Direct ID injection (safe for number)
       if (result.length > 0 && result[0].values.length > 0) {
         const row = result[0].values[0]
         return {
            id: row[0] as number,
            title: row[1] as string,
            description: row[2] as string,
            start_time: row[3] as string,
            end_time: row[4] as string,
            category: row[5] as string,
            color: row[6] as string,
            created_at: row[7] as string,
            updated_at: row[8] as string
         }
       }
    } catch (e) {
      console.error('[DatabaseManager] Failed to fetch updated event:', e)
    }
    
    return null
  }

  deleteEvent(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM events WHERE id = ?', [id])
    this.save()
    return true
  }

  // ----- HOLIDAYS -----

  getHolidays(): Holiday[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM holidays ORDER BY date ASC')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      date: row[2] as string,
      country_code: row[3] as string,
      created_at: row[4] as string
    }))
  }

  getHoliday(id: number): Holiday | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT * FROM holidays WHERE id = ?', [id])
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      name: row[1] as string,
      date: row[2] as string,
      country_code: row[3] as string,
      created_at: row[4] as string
    }
  }

  addHoliday(holiday: Omit<Holiday, 'id' | 'created_at'>): Holiday {
    if (!this.db) throw new Error('Database not initialized')
    
    this.db.run(
      `INSERT INTO holidays (name, date, country_code)
       VALUES (?, ?, ?)`,
      [
        holiday.name,
        holiday.date,
        holiday.country_code || 'US'
      ]
    )
    
    this.save()
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    return this.getHoliday(id)!
  }

  deleteHoliday(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM holidays WHERE id = ?', [id])
    this.save()
    return true
  }

  importHolidays(holidays: Omit<Holiday, 'id' | 'created_at'>[]): void {
    if (!this.db) return
    
    for (const holiday of holidays) {
      this.db.run(
        `INSERT INTO holidays (name, date, country_code)
         VALUES (?, ?, ?)`,
        [holiday.name, holiday.date, holiday.country_code || 'US']
      )
    }
    
    this.save()
  }

  // ----- FINANCES -----

  getFinances(): Finance[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM finances ORDER BY date DESC')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      type: row[1] as 'income' | 'expense',
      amount: row[2] as number,
      category: row[3] as string,
      description: row[4] as string,
      date: row[5] as string,
      asset_id: row[6] as number | null,
      created_at: row[7] as string,
      updated_at: row[8] as string
    }))
  }

  getFinance(id: number): Finance | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT * FROM finances WHERE id = ?', [id])
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      type: row[1] as 'income' | 'expense',
      amount: row[2] as number,
      category: row[3] as string,
      description: row[4] as string,
      date: row[5] as string,
      asset_id: row[6] as number | null,
      created_at: row[7] as string,
      updated_at: row[8] as string
    }
  }

  addFinance(finance: Omit<Finance, 'id' | 'created_at' | 'updated_at'>): Finance {
    if (!this.db) throw new Error('Database not initialized')
    
    this.db.run(
      `INSERT INTO finances (type, amount, category, description, date, asset_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        finance.type,
        finance.amount,
        finance.category,
        finance.description || '',
        finance.date,
        finance.asset_id || null
      ]
    )
    
    this.save()
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    return this.getFinance(id)!
  }

  updateFinance(id: number, updates: Partial<Finance>): Finance | null {
    if (!this.db) return null
    
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?')
      values.push(updates.amount)
    }
    if (updates.category !== undefined) {
      fields.push('category = ?')
      values.push(updates.category)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.date !== undefined) {
      fields.push('date = ?')
      values.push(updates.date)
    }
    if (updates.asset_id !== undefined) {
      fields.push('asset_id = ?')
      values.push(updates.asset_id)
    }
    
    if (fields.length === 0) return this.getFinance(id)
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    this.db.run(`UPDATE finances SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    
    return this.getFinance(id)
  }

  deleteFinance(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM finances WHERE id = ?', [id])
    this.save()
    return true
  }

  addFinancesBulk(finances: Omit<Finance, 'id' | 'created_at' | 'updated_at'>[]): void {
    if (!this.db) return
    
    for (const finance of finances) {
      this.db.run(
        `INSERT INTO finances (type, amount, category, description, date, asset_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          finance.type,
          finance.amount,
          finance.category,
          finance.description || '',
          finance.date,
          finance.asset_id || null
        ]
      )
    }
    
    this.save()
  }

  // ----- ASSETS -----

  getAssets(): Asset[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM assets ORDER BY created_at DESC')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      type: row[2] as string,
      balance: row[3] as number,
      currency: row[4] as string,
      created_at: row[5] as string,
      updated_at: row[6] as string
    }))
  }

  getAsset(id: number): Asset | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT * FROM assets WHERE id = ?', [id])
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      name: row[1] as string,
      type: row[2] as string,
      balance: row[3] as number,
      currency: row[4] as string,
      created_at: row[5] as string,
      updated_at: row[6] as string
    }
  }

  addAsset(asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Asset {
    if (!this.db) throw new Error('Database not initialized')
    
    this.db.run(
      `INSERT INTO assets (name, type, balance, currency)
       VALUES (?, ?, ?, ?)`,
      [
        asset.name,
        asset.type,
        asset.balance || 0,
        asset.currency || 'USD'
      ]
    )
    
    this.save()
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    return this.getAsset(id)!
  }

  updateAsset(id: number, updates: Partial<Asset>): Asset | null {
    if (!this.db) return null
    
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.balance !== undefined) {
      fields.push('balance = ?')
      values.push(updates.balance)
    }
    if (updates.currency !== undefined) {
      fields.push('currency = ?')
      values.push(updates.currency)
    }
    
    if (fields.length === 0) return this.getAsset(id)
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    this.db.run(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    
    return this.getAsset(id)
  }

  deleteAsset(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM assets WHERE id = ?', [id])
    this.save()
    return true
  }

  // ----- SETTINGS -----

  getSettings(): Setting[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM settings')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      key: row[1] as string,
      value: row[2] as string
    }))
  }

  getSetting(key: string): string | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT value FROM settings WHERE key = ?', [key])
    if (result.length === 0 || result[0].values.length === 0) return null
    return result[0].values[0][0] as string
  }

  setSetting(key: string, value: string): void {
    if (!this.db) return
    
    // Check if setting exists
    const existing = this.getSetting(key)
    if (existing !== null) {
      this.db.run('UPDATE settings SET value = ? WHERE key = ?', [value, key])
    } else {
      this.db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value])
    }
    
    this.save()
  }

  deleteSetting(key: string): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM settings WHERE key = ?', [key])
    this.save()
    return true
  }

  // ----- HUB SERVICES -----

  getHubServices(): HubService[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM hub_services ORDER BY position ASC')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      url: row[2] as string,
      icon: row[3] as string,
      color: row[4] as string,
      position: row[5] as number,
      enabled: row[6] === 1,
      created_at: row[7] as string
    }))
  }

  getHubService(id: number): HubService | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT * FROM hub_services WHERE id = ?', [id])
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      name: row[1] as string,
      url: row[2] as string,
      icon: row[3] as string,
      color: row[4] as string,
      position: row[5] as number,
      enabled: row[6] === 1,
      created_at: row[7] as string
    }
  }

  addHubService(service: Omit<HubService, 'id' | 'created_at'>): HubService {
    if (!this.db) throw new Error('Database not initialized')
    
    this.db.run(
      `INSERT INTO hub_services (name, url, icon, color, position, enabled)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        service.name,
        service.url,
        service.icon || '',
        service.color || '#FFFFFF',
        service.position || 0,
        service.enabled ? 1 : 0
      ]
    )
    
    this.save()
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    return this.getHubService(id)!
  }

  updateHubService(id: number, updates: Partial<HubService>): HubService | null {
    if (!this.db) return null
    
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.url !== undefined) {
      fields.push('url = ?')
      values.push(updates.url)
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?')
      values.push(updates.icon)
    }
    if (updates.color !== undefined) {
      fields.push('color = ?')
      values.push(updates.color)
    }
    if (updates.position !== undefined) {
      fields.push('position = ?')
      values.push(updates.position)
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?')
      values.push(updates.enabled ? 1 : 0)
    }
    
    if (fields.length === 0) return this.getHubService(id)
    
    values.push(id)
    
    this.db.run(`UPDATE hub_services SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    
    return this.getHubService(id)
  }

  deleteHubService(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM hub_services WHERE id = ?', [id])
    this.save()
    return true
  }

  reorderHubServices(serviceIds: number[]): void {
    if (!this.db) return
    
    serviceIds.forEach((id, index) => {
      this.db!.run('UPDATE hub_services SET position = ? WHERE id = ?', [index, id])
    })
    
    this.save()
  }

  // ----- CALENDAR SOURCES -----

  getCalendarSources(): CalendarSource[] {
    if (!this.db) return []
    const result = this.db.exec('SELECT * FROM calendar_sources ORDER BY created_at DESC')
    if (result.length === 0) return []
    
    return result[0].values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      url: row[2] as string,
      color: row[3] as string,
      enabled: row[4] === 1,
      created_at: row[5] as string,
      updated_at: row[6] as string
    }))
  }

  getCalendarSource(id: number): CalendarSource | null {
    if (!this.db) return null
    const result = this.db.exec('SELECT * FROM calendar_sources WHERE id = ?', [id])
    if (result.length === 0 || result[0].values.length === 0) return null
    
    const row = result[0].values[0]
    return {
      id: row[0] as number,
      name: row[1] as string,
      url: row[2] as string,
      color: row[3] as string,
      enabled: row[4] === 1,
      created_at: row[5] as string,
      updated_at: row[6] as string
    }
  }

  addCalendarSource(source: Omit<CalendarSource, 'id' | 'created_at' | 'updated_at'>): CalendarSource {
    if (!this.db) throw new Error('Database not initialized')
    
    this.db.run(
      `INSERT INTO calendar_sources (name, url, color, enabled)
       VALUES (?, ?, ?, ?)`,
      [
        source.name,
        source.url,
        source.color || '#FFFFFF',
        source.enabled ? 1 : 0
      ]
    )
    
    this.save()
    
    const result = this.db.exec('SELECT last_insert_rowid()')
    const id = result[0].values[0][0] as number
    return this.getCalendarSource(id)!
  }

  updateCalendarSource(id: number, updates: Partial<CalendarSource>): CalendarSource | null {
    if (!this.db) return null
    
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.url !== undefined) {
      fields.push('url = ?')
      values.push(updates.url)
    }
    if (updates.color !== undefined) {
      fields.push('color = ?')
      values.push(updates.color)
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?')
      values.push(updates.enabled ? 1 : 0)
    }
    
    if (fields.length === 0) return this.getCalendarSource(id)
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    this.db.run(`UPDATE calendar_sources SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    
    return this.getCalendarSource(id)
  }

  deleteCalendarSource(id: number): boolean {
    if (!this.db) return false
    this.db.run('DELETE FROM calendar_sources WHERE id = ?', [id])
    this.save()
    return true
  }

  // ===== CALENDAR ITEMS MIGRATION METHODS =====

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

  private migrateForGoogleSync(): void {
    if (!this.db) return
    try {
        const columns = this.db.exec("PRAGMA table_info(calendar_items)")[0]?.values.map(col => col[1] as string) || []
        
        if (!columns.includes('is_synced')) {
            console.log('[DatabaseManager] Adding sync columns to calendar_items...')
            this.db.run("ALTER TABLE calendar_items ADD COLUMN is_synced INTEGER DEFAULT 0")
            this.db.run("ALTER TABLE calendar_items ADD COLUMN timezone TEXT")
            this.db.run("ALTER TABLE calendar_items ADD COLUMN is_all_day INTEGER DEFAULT 0")
            // Display fields for UI persistence
            this.db.run("ALTER TABLE calendar_items ADD COLUMN date TEXT")
            this.db.run("ALTER TABLE calendar_items ADD COLUMN startTime TEXT")
            this.db.run("ALTER TABLE calendar_items ADD COLUMN endTime TEXT")
            this.save()
        } else if (!columns.includes('date')) {
            // Case where is_synced exists but date/times don't (incremental update)
             console.log('[DatabaseManager] Adding display time columns to calendar_items...')
             this.db.run("ALTER TABLE calendar_items ADD COLUMN date TEXT")
             this.db.run("ALTER TABLE calendar_items ADD COLUMN startTime TEXT")
             this.db.run("ALTER TABLE calendar_items ADD COLUMN endTime TEXT")
             this.save()
        }
    } catch (error) {
        console.error('[DatabaseManager] Sync Migration failed:', error)
    }
  }

  /**
   * Bulk save synced items (Offline-First)
   */
  async saveSyncedItems(items: any[]): Promise<boolean> {
    if (!this.db) return false
    
    // Ensure schema is ready
    this.migrateForGoogleSync()

    try {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO calendar_items (
                id, title, description,
                type, domain, status, priority,
                start_time, end_time,
                is_all_day, is_synced, timezone,
                date, startTime, endTime,
                metadata,
                created_at, updated_at
            ) VALUES (
                @id, @title, @description,
                @type, @domain, @status, @priority,
                @start_time, @end_time,
                @is_all_day, @is_synced, @timezone,
                @date, @startTime, @endTime,
                @metadata,
                @created_at, @updated_at
            )
        `)

        console.log(`[DatabaseManager] Upserting ${items.length} synced items...`)

        this.db.exec('BEGIN TRANSACTION')
        
        for (const item of items) {
             try {
                // Prepare metadata (still keep extended info)
                const metadata = JSON.stringify({
                    ...(item.metadata || {}),
                    googleEventId: item.googleEventId,
                    googleCalendarId: item.googleCalendarId
                })

                stmt.run({
                    '@id': item.id,
                    '@title': item.title || '(No Title)',
                    '@description': item.description || '',
                    '@type': item.type || 'event',
                    '@domain': item.domain || 'work',
                    '@status': item.status || 'todo',
                    '@priority': item.priority || 'medium',
                    '@start_time': item.start_time,
                    '@end_time': item.end_time,
                    '@is_all_day': item.is_all_day ? 1 : 0,
                    '@is_synced': 1,
                    '@timezone': item.timezone,
                    '@date': item.date,
                    '@startTime': item.startTime,
                    '@endTime': item.endTime,
                    '@metadata': metadata,
                    '@created_at': new Date().toISOString(),
                    '@updated_at': new Date().toISOString()
                })
             } catch (rowError) {
                 console.error('[DatabaseManager] Error saving row:', item.id, rowError)
             }
        }

        this.db.exec('COMMIT')
        this.save()
        console.log('[DatabaseManager] Sync save complete.')
        return true
    } catch (error) {
        console.error('[DatabaseManager] Failed to save synced items. DETAILS:', error)
        try { this.db.exec('ROLLBACK') } catch (e) {}
        return false
    }
  }
  /**
   * Seed dummy data for Sanctuary visualization
   */
  async seedDummyData(): Promise<void> {
    if (!this.db) return

    try {
      console.log('[DatabaseManager] Seeding dummy data...')
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      
      // Delete existing items for today to avoid duplicates/clutter
      // We'll delete items that start with today's date in start_time or due_date
      this.db.run(`DELETE FROM calendar_items WHERE start_time LIKE '${today}%' OR due_date LIKE '${today}%'`)
      
      // Also delete any existing seed items from past runs
      this.db.run(`DELETE FROM calendar_items WHERE id LIKE 'seed-%'`)

      const items = [
        {
          id: `seed-1-${Date.now()}`,
          title: "Team Standup",
          type: 'event',
          domain: 'work',
          status: 'done',
          priority: 'medium',
          start_time: `${today}T09:00:00.000Z`,
          end_time: `${today}T09:30:00.000Z`,
          color: '#3b82f6'
        },
        {
          id: `seed-2-${Date.now()}`,
          title: "Review Q3 Report",
          type: 'task',
          domain: 'work',
          status: 'todo',
          priority: 'high',
          start_time: `${today}T10:30:00.000Z`,
          estimate_minutes: 60,
          color: '#ef4444'
        },
        {
          id: `seed-3-${Date.now()}`,
          title: "Drink Water",
          type: 'habit',
          domain: 'life',
          status: 'todo', 
          priority: 'medium',
          start_time: `${today}T08:00:00.000Z`,
          is_all_day: true,
          color: '#10b981'
        },
        {
          id: `seed-4-${Date.now()}`,
          title: "Client Meeting with Sarah",
          type: 'event',
          domain: 'work',
          status: 'todo',
          priority: 'high',
          start_time: `${today}T14:00:00.000Z`,
          end_time: `${today}T15:00:00.000Z`,
          color: '#8b5cf6'
        },
        {
          id: `seed-5-${Date.now()}`,
          title: "Deploy to Production",
          type: 'task',
          domain: 'work',
          status: 'todo',
          priority: 'high',
          start_time: `${today}T16:00:00.000Z`,
          estimate_minutes: 30,
          color: '#f59e0b'
        },
         {
          id: `seed-6-${Date.now()}`,
          title: "Read 'Deep Work'",
          type: 'task',
          domain: 'study',
          status: 'todo',
          priority: 'medium',
          start_time: `${today}T20:00:00.000Z`,
          estimate_minutes: 45,
          color: '#ec4899'
        }
      ]

      const stmt = this.db.prepare(`
        INSERT INTO calendar_items (
          id, title, type, domain, status, priority, start_time, end_time, due_date, color, estimate_minutes, is_all_day, created_at, updated_at
        ) VALUES (
          @id, @title, @type, @domain, @status, @priority, @start_time, @end_time, @due_date, @color, @estimate_minutes, @is_all_day, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `)

      this.db.exec('BEGIN TRANSACTION')
      for (const item of items) {
        stmt.run({
          '@id': item.id,
          '@title': item.title,
          '@type': item.type,
          '@domain': item.domain,
          '@status': item.status,
          '@priority': item.priority,
          '@start_time': item.start_time,
          '@end_time': item.end_time || null,
          '@due_date': item.start_time, 
          '@color': item.color,
          '@estimate_minutes': item.estimate_minutes || null,
          '@is_all_day': item.is_all_day ? 1 : 0
        })
      }
      this.db.exec('COMMIT')
      stmt.free()
      
      this.save()
      console.log('[DatabaseManager] Seeded dummy data successfully')
    } catch (error) {
      console.error('[DatabaseManager] Failed to seed dummmy data:', error)
      try { this.db.exec('ROLLBACK') } catch (e) {}
    }
  }
}
