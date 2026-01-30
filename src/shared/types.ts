// Shared interfaces for both Main and Renderer processes

export interface Task {
  id?: number
  title: string
  description: string
  completed: boolean
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  eisenhower_quadrant: 'urgent_important' | 'not_urgent_important' | 'urgent_not_important' | 'not_urgent_not_important' | null
  client_project: string | null
  milestone_id: number | null
  due_date: string | null
  order_index: number
  subtasks?: string | null // JSON string of SubTask[]
  recurrence?: string | null // 'daily' | 'weekly' | 'monthly' | null
  tags?: string | null // JSON string of tag names
  created_at?: string
  updated_at?: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface TaskTag {
  name: string
  color: string
}

export interface CalendarSource {
  id?: number
  name: string
  url: string // iCal URL
  color: string
  enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface ExternalEvent {
  title: string
  description: string
  start_time: string
  end_time: string
  source: string // Calendar source name
  color: string // From calendar source
  isExternal: true // Flag to distinguish from local events
}

export interface Milestone {
  id?: number
  title: string
  description: string
  target_date: string | null
  completed: boolean
  color: string
  created_at?: string
  updated_at?: string
}

export interface Event {
  id?: number
  title: string
  description: string
  start_time: string
  end_time: string
  category: string
  color: string
  type?: 'event' | 'task'
  status?: 'todo' | 'in_progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  created_at?: string
  updated_at?: string
}

// ===== POLYMORPHIC ITEM SYSTEM =====
// Unified type system for Events, Tasks, Milestones, and Habits

export type ItemType = 'event' | 'task' | 'milestone' | 'habit' | 'invest'
export type ItemDomain = 'work' | 'life' | 'study' | 'invest'
export type ItemStatus = 'todo' | 'doing' | 'done'
export type ItemPriority = 'low' | 'medium' | 'high'

export interface ItemMetadata {
  topic?: string
  color?: string
  location?: string
  meet_link?: string
  attendees?: string[]
  linked_project_id?: string
  target_value?: number // For Milestones (e.g., 100% completion)
  current_value?: number // For Milestones (e.g., 45% current progress)
  habit_streak?: number // For Habits
  habit_frequency?: 'daily' | 'weekly' | 'monthly' // For Habits
  target_streak?: number // For Habits
  habit_end_date?: string // ISO String - When habit recurrence should stop
  estimated_time?: number // For Tasks (in minutes)
  
  // Investment Metadata
  ticker?: string
  amount?: number
  transaction_type?: 'buy' | 'sell'
  currency?: string
}

export interface CalendarItem {
  id?: number | string
  title: string
  description?: string
  type: ItemType
  domain: ItemDomain
  status: ItemStatus
  priority: ItemPriority
  
  // Time Fields (flexible based on type)
  start_time?: string // ISO String (For Events)
  end_time?: string   // ISO String (For Events)
  due_date?: string   // ISO String (For Tasks/Milestones)
  is_all_day?: boolean // For all-day events
  
  // Performance Metrics
  estimate_minutes?: number
  actual_minutes?: number
  actual_end_time?: string // ISO String - When item was actually completed
  
  // Recurrence
  recurrence_rule?: string // RRULE string for recurring items
  
  // Project Management
  project_id?: string
  subtasks?: { id: string; title: string; completed: boolean }[] // Micro-tasks
  checklist?: ChecklistItem[] // Sub-tasks/checklist items
  
  // Flexible Metadata (stored as JSON string in DB)
  metadata?: ItemMetadata
  
  // Visual
  color?: string
  
  // System Fields
  created_at?: string
  updated_at?: string
  
  // Sync Metadata
  isSynced?: boolean
  googleEventId?: string
  googleCalendarId?: string
  
  // Timezone & Display Handlers
  timezone?: string
  date?: string
  startTime?: string
  endTime?: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  created_at?: string
}

export interface Holiday {
  id?: number
  name: string
  date: string
  country_code: string
  created_at?: string
}

export interface Finance {
  id?: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  asset_id: number | null
  created_at?: string
  updated_at?: string
}

export interface Asset {
  id?: number
  name: string
  type: string
  balance: number
  currency: string
  created_at?: string
  updated_at?: string
}

export interface Setting {
  id?: number
  key: string
  value: string
}

export interface HubService {
  id?: number
  name: string
  url: string
  icon: string
  color: string
  position: number
  enabled: boolean
  created_at?: string
}

export interface ZenFlowAPI {
  // Tasks
  getTasks: () => Promise<Task[]>
  getTask: (id: number) => Promise<Task | null>
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>
  updateTask: (id: number, updates: Partial<Task>) => Promise<Task | null>
  deleteTask: (id: number) => Promise<boolean>

  // Milestones
  getMilestones: () => Promise<Milestone[]>
  getMilestone: (id: number) => Promise<Milestone | null>
  addMilestone: (milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) => Promise<Milestone>
  updateMilestone: (id: number, updates: Partial<Milestone>) => Promise<Milestone | null>
  deleteMilestone: (id: number) => Promise<boolean>

  // Events
  getEvents: () => Promise<Event[]>
  getEvent: (id: number) => Promise<Event | null>
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<Event>
  updateEvent: (id: number, updates: Partial<Event>) => Promise<Event | null>
  deleteEvent: (id: number) => Promise<boolean>

  // Holidays
  getHolidays: () => Promise<Holiday[]>
  getHoliday: (id: number) => Promise<Holiday | null>
  addHoliday: (holiday: Omit<Holiday, 'id' | 'created_at'>) => Promise<Holiday>
  deleteHoliday: (id: number) => Promise<boolean>
  importHolidays: (holidays: Omit<Holiday, 'id' | 'created_at'>[]) => Promise<void>

  // Finances
  getFinances: () => Promise<Finance[]>
  getFinance: (id: number) => Promise<Finance | null>
  addFinance: (finance: Omit<Finance, 'id' | 'created_at' | 'updated_at'>) => Promise<Finance>
  updateFinance: (id: number, updates: Partial<Finance>) => Promise<Finance | null>
  deleteFinance: (id: number) => Promise<boolean>
  addFinancesBulk: (finances: Omit<Finance, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>

  // Assets
  getAssets: () => Promise<Asset[]>
  getAsset: (id: number) => Promise<Asset | null>
  addAsset: (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => Promise<Asset>
  updateAsset: (id: number, updates: Partial<Asset>) => Promise<Asset | null>
  deleteAsset: (id: number) => Promise<boolean>

  // Settings
  getSettings: () => Promise<Setting[]>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  deleteSetting: (key: string) => Promise<boolean>

  // Hub Services
  getHubServices: () => Promise<HubService[]>
  getHubService: (id: number) => Promise<HubService | null>
  addHubService: (service: Omit<HubService, 'id' | 'created_at'>) => Promise<HubService>
  updateHubService: (id: number, updates: Partial<HubService>) => Promise<HubService | null>
  deleteHubService: (id: number) => Promise<boolean>
  reorderHubServices: (serviceIds: number[]) => Promise<void>

  // Calendar Sources
  getCalendarSources: () => Promise<CalendarSource[]>
  getCalendarSource: (id: number) => Promise<CalendarSource | null>
  addCalendarSource: (source: Omit<CalendarSource, 'id' | 'created_at' | 'updated_at'>) => Promise<CalendarSource>
  updateCalendarSource: (id: number, updates: Partial<CalendarSource>) => Promise<CalendarSource | null>
  deleteCalendarSource: (id: number) => Promise<boolean>
  syncExternalCalendars: () => Promise<ExternalEvent[]>

  // Utility
  getDbPath: () => Promise<string>
}
