import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { CalendarItem, ItemType, ItemDomain } from '../shared/types'

// Type definitions matching DatabaseManager.ts
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
  subtasks?: string | null
  recurrence?: string | null
  tags?: string | null
  created_at?: string
  updated_at?: string
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
  is_holiday: boolean
  created_at?: string
  updated_at?: string
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

export interface CalendarSource {
  id?: number
  name: string
  url: string
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
  source: string
  color: string
  isExternal: true
}

// API object exposed to renderer
const api = {
  // ----- Tasks -----
  getTasks: (): Promise<Task[]> => ipcRenderer.invoke('db:get-tasks'),
  getTask: (id: number): Promise<Task | null> => ipcRenderer.invoke('db:get-task', id),
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> =>
    ipcRenderer.invoke('db:add-task', task),
  updateTask: (id: number, updates: Partial<Task>): Promise<Task | null> =>
    ipcRenderer.invoke('db:update-task', id, updates),
  deleteTask: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-task', id),

  // ----- Events -----
  getEvents: (): Promise<Event[]> => ipcRenderer.invoke('db:get-events'),
  getEvent: (id: number): Promise<Event | null> => ipcRenderer.invoke('db:get-event', id),
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> =>
    ipcRenderer.invoke('db:add-event', event),
  updateEvent: (id: number, updates: Partial<Event>): Promise<Event | null> =>
    ipcRenderer.invoke('db:update-event', id, updates),
  deleteEvent: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-event', id),

  // ----- Finances -----
  getFinances: (): Promise<Finance[]> => ipcRenderer.invoke('db:get-finances'),
  getFinance: (id: number): Promise<Finance | null> => ipcRenderer.invoke('db:get-finance', id),
  addFinance: (finance: Omit<Finance, 'id' | 'created_at' | 'updated_at'>): Promise<Finance> =>
    ipcRenderer.invoke('db:add-finance', finance),
  updateFinance: (id: number, updates: Partial<Finance>): Promise<Finance | null> =>
    ipcRenderer.invoke('db:update-finance', id, updates),
  deleteFinance: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-finance', id),
  addFinancesBulk: (finances: Omit<Finance, 'id' | 'created_at' | 'updated_at'>[]): Promise<void> =>
    ipcRenderer.invoke('db:add-finances-bulk', finances),

  // ----- Assets -----
  getAssets: (): Promise<Asset[]> => ipcRenderer.invoke('db:get-assets'),
  getAsset: (id: number): Promise<Asset | null> => ipcRenderer.invoke('db:get-asset', id),
  addAsset: (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>): Promise<Asset> =>
    ipcRenderer.invoke('db:add-asset', asset),
  updateAsset: (id: number, updates: Partial<Asset>): Promise<Asset | null> =>
    ipcRenderer.invoke('db:update-asset', id, updates),
  deleteAsset: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-asset', id),

  // ----- Settings -----
  getSettings: (): Promise<Setting[]> => ipcRenderer.invoke('db:get-settings'),
  getSetting: (key: string): Promise<string | null> => ipcRenderer.invoke('db:get-setting', key),
  setSetting: (key: string, value: string): Promise<void> =>
    ipcRenderer.invoke('db:set-setting', key, value),
  deleteSetting: (key: string): Promise<boolean> => ipcRenderer.invoke('db:delete-setting', key),

  // ----- Hub Services -----
  getHubServices: (): Promise<HubService[]> => ipcRenderer.invoke('db:get-hub-services'),
  getHubService: (id: number): Promise<HubService | null> => 
    ipcRenderer.invoke('db:get-hub-service', id),
  addHubService: (service: Omit<HubService, 'id' | 'created_at'>): Promise<HubService> =>
    ipcRenderer.invoke('db:add-hub-service', service),
  updateHubService: (id: number, updates: Partial<HubService>): Promise<HubService | null> =>
    ipcRenderer.invoke('db:update-hub-service', id, updates),
  deleteHubService: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-hub-service', id),
  reorderHubServices: (serviceIds: number[]): Promise<void> =>
    ipcRenderer.invoke('db:reorder-hub-services', serviceIds),

  // ----- Milestones -----
  getMilestones: (): Promise<Milestone[]> => ipcRenderer.invoke('db:get-milestones'),
  getMilestone: (id: number): Promise<Milestone | null> => ipcRenderer.invoke('db:get-milestone', id),
  addMilestone: (milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>): Promise<Milestone> =>
    ipcRenderer.invoke('db:add-milestone', milestone),
  updateMilestone: (id: number, updates: Partial<Milestone>): Promise<Milestone | null> =>
    ipcRenderer.invoke('db:update-milestone', id, updates),
  deleteMilestone: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-milestone', id),

  // ----- Holidays -----
  getHolidays: (): Promise<Holiday[]> => ipcRenderer.invoke('db:get-holidays'),
  getHoliday: (id: number): Promise<Holiday | null> => ipcRenderer.invoke('db:get-holiday', id),
  addHoliday: (holiday: Omit<Holiday, 'id' | 'created_at'>): Promise<Holiday> =>
    ipcRenderer.invoke('db:add-holiday', holiday),
  deleteHoliday: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-holiday', id),
  importHolidays: (holidays: Omit<Holiday, 'id' | 'created_at'>[]): Promise<void> =>
    ipcRenderer.invoke('db:import-holidays', holidays),

  // ----- Calendar Sources -----
  getCalendarSources: (): Promise<CalendarSource[]> => ipcRenderer.invoke('db:get-calendar-sources'),
  getCalendarSource: (id: number): Promise<CalendarSource | null> => 
    ipcRenderer.invoke('db:get-calendar-source', id),
  addCalendarSource: (source: Omit<CalendarSource, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarSource> =>
    ipcRenderer.invoke('db:add-calendar-source', source),
  updateCalendarSource: (id: number, updates: Partial<CalendarSource>): Promise<CalendarSource | null> =>
    ipcRenderer.invoke('db:update-calendar-source', id, updates),
  deleteCalendarSource: (id: number): Promise<boolean> => ipcRenderer.invoke('db:delete-calendar-source', id),
  syncExternalCalendars: (): Promise<ExternalEvent[]> => ipcRenderer.invoke('db:sync-external-calendars'),

  // ----- Calendar Items (Life OS) -----
  calendar: {
    getCalendarItems: (filters?: {
      startDate?: string
      endDate?: string
      domains?: ItemDomain[]
      types?: ItemType[]
      projectId?: string
      status?: string
    }): Promise<CalendarItem[]> => ipcRenderer.invoke('calendar:get-items', filters),
    
    getCalendarItem: (id: string): Promise<CalendarItem | null> => 
      ipcRenderer.invoke('calendar:get-item', id),
    
    createCalendarItem: (data: Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarItem> =>
      ipcRenderer.invoke('calendar:create-item', data),
    
    updateCalendarItem: (
      id: string, 
      updates: Partial<Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<CalendarItem | null> =>
      ipcRenderer.invoke('calendar:update-item', id, updates),
    
    deleteCalendarItem: (id: string): Promise<boolean> =>
      ipcRenderer.invoke('calendar:delete-item', id),
    
    getCalendarItemsByDomain: (domain: ItemDomain): Promise<CalendarItem[]> =>
      ipcRenderer.invoke('calendar:get-by-domain', domain),
    
    getCalendarItemsByType: (type: ItemType): Promise<CalendarItem[]> =>
      ipcRenderer.invoke('calendar:get-by-type', type),
    
    getCalendarItemsByProject: (projectId: string): Promise<CalendarItem[]> =>
      ipcRenderer.invoke('calendar:get-by-project', projectId),

    getGoogleEvents: (timeMin: string, timeMax: string): Promise<any[]> =>
      ipcRenderer.invoke('calendar:get-google-events', timeMin, timeMax),

    deleteGoogleEvent: (eventId: string): Promise<any> =>
        ipcRenderer.invoke('calendar:delete-google-event', eventId),

    saveSyncedItems: (items: any[]): Promise<boolean> =>
        ipcRenderer.invoke('calendar:save-synced-items', items)
  },

  // ----- Authentication -----
  auth: {
    signInGoogle: (): Promise<any> => ipcRenderer.invoke('auth:google-signin'),
    signOutGoogle: (): Promise<void> => ipcRenderer.invoke('auth:google-signout'),
    checkStatus: (): Promise<boolean> => ipcRenderer.invoke('auth:google-status'),
    getProfile: (): Promise<{ email: string; name: string; picture: string } | null> => 
      ipcRenderer.invoke('auth:google-profile')
  },

  // ----- Utility -----
  getDbPath: (): Promise<string> => ipcRenderer.invoke('db:get-path'),
  seedDummyData: (): Promise<void> => ipcRenderer.invoke('db:seed-dummy-data')
}

// Export type for renderer
export type ApiType = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
