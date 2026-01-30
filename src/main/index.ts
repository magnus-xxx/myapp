import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DatabaseManager } from './DatabaseManager'
import { CalendarManager } from './CalendarManager'
import { CalendarService } from './services/CalendarService'
import { registerCalendarHandlers } from './ipc/calendarHandlers'
import { Task, Event, Finance, HubService, Milestone, Holiday, Asset, CalendarSource } from '../shared/types'

// Global database and calendar manager instances
let db: DatabaseManager
let calendarManager: CalendarManager
let calendarService: CalendarService

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0A0A0A',
    titleBarStyle: 'hiddenInset',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Thêm đoạn này vào bên trong hàm createWindow(), ngay sau mainWindow.on('ready-to-show'...)

  // SECURITY: Chặn quyền của các thẻ <webview> (Zalo, Lark...)
  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences, _params) => {
    // Tước bỏ quyền truy cập Node.js của trang web nhúng
    delete webPreferences.preload
    webPreferences.nodeIntegration = false
    webPreferences.contextIsolation = true
    
    // Chặn mở cửa sổ mới (Popups) từ bên trong Zalo
    // Zalo hay có trò click link nhảy ra cửa sổ quảng cáo
    // event.preventDefault() // Nếu muốn chặn hoàn toàn việc tạo webview mới
  })
  
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ============================================
// IPC HANDLERS - Database Operations
// ============================================

function setupIpcHandlers(): void {
  console.log('[Main] Registering IPC handlers...')
  
  ipcMain.handle('db:seed-dummy-data', async () => {
    console.log('[Main] Handling db:seed-dummy-data request')
    return db.seedDummyData()
  })

  // ----- Tasks -----
  ipcMain.handle('db:get-tasks', () => {
    return db.getTasks()
  })

  ipcMain.handle('db:get-task', (_event, id: number) => {
    return db.getTask(id)
  })

  ipcMain.handle('db:add-task', (_event, task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    return db.addTask(task)
  })

  ipcMain.handle('db:update-task', (_event, id: number, updates: Partial<Task>) => {
    return db.updateTask(id, updates)
  })

  ipcMain.handle('db:delete-task', (_event, id: number) => {
    return db.deleteTask(id)
  })

  // ----- Events -----
  ipcMain.handle('db:get-events', () => {
    return db.getEvents()
  })

  ipcMain.handle('db:get-event', (_event, id: number) => {
    return db.getEvent(id)
  })

  ipcMain.handle('db:add-event', (_event, eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    return db.addEvent(eventData)
  })

  ipcMain.handle('db:update-event', (_event, id: number, updates: Partial<Event>) => {
    return db.updateEvent(id, updates)
  })

  ipcMain.handle('db:delete-event', (_event, id: number) => {
    return db.deleteEvent(id)
  })

  // ----- Finances -----
  ipcMain.handle('db:get-finances', () => {
    return db.getFinances()
  })

  ipcMain.handle('db:get-finance', (_event, id: number) => {
    return db.getFinance(id)
  })

  ipcMain.handle('db:add-finance', (_event, finance: Omit<Finance, 'id' | 'created_at' | 'updated_at'>) => {
    return db.addFinance(finance)
  })

  ipcMain.handle('db:update-finance', (_event, id: number, updates: Partial<Finance>) => {
    return db.updateFinance(id, updates)
  })

  ipcMain.handle('db:delete-finance', (_event, id: number) => {
    return db.deleteFinance(id)
  })

  ipcMain.handle('db:add-finances-bulk', (_event, finances: Omit<Finance, 'id' | 'created_at' | 'updated_at'>[]) => {
    return db.addFinancesBulk(finances)
  })

  // ----- Assets -----
  ipcMain.handle('db:get-assets', () => {
    return db.getAssets()
  })

  ipcMain.handle('db:get-asset', (_event, id: number) => {
    return db.getAsset(id)
  })

  ipcMain.handle('db:add-asset', (_event, asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
    return db.addAsset(asset)
  })

  ipcMain.handle('db:update-asset', (_event, id: number, updates: Partial<Asset>) => {
    return db.updateAsset(id, updates)
  })

  ipcMain.handle('db:delete-asset', (_event, id: number) => {
    return db.deleteAsset(id)
  })

  // ----- Settings -----
  ipcMain.handle('db:get-settings', () => {
    return db.getSettings()
  })

  ipcMain.handle('db:get-setting', (_event, key: string) => {
    return db.getSetting(key)
  })

  ipcMain.handle('db:set-setting', (_event, key: string, value: string) => {
    return db.setSetting(key, value)
  })

  ipcMain.handle('db:delete-setting', (_event, key: string) => {
    return db.deleteSetting(key)
  })

  // ----- Hub Services -----
  ipcMain.handle('db:get-hub-services', () => {
    return db.getHubServices()
  })

  ipcMain.handle('db:get-hub-service', (_event, id: number) => {
    return db.getHubService(id)
  })

  ipcMain.handle('db:add-hub-service', (_event, service: Omit<HubService, 'id' | 'created_at'>) => {
    return db.addHubService(service)
  })

  ipcMain.handle('db:update-hub-service', (_event, id: number, updates: Partial<HubService>) => {
    return db.updateHubService(id, updates)
  })

  ipcMain.handle('db:delete-hub-service', (_event, id: number) => {
    return db.deleteHubService(id)
  })

  ipcMain.handle('db:reorder-hub-services', (_event, serviceIds: number[]) => {
    return db.reorderHubServices(serviceIds)
  })

  // ----- Milestones -----
  ipcMain.handle('db:get-milestones', () => {
    return db.getMilestones()
  })

  ipcMain.handle('db:get-milestone', (_event, id: number) => {
    return db.getMilestone(id)
  })

  ipcMain.handle('db:add-milestone', (_event, milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) => {
    return db.addMilestone(milestone)
  })

  ipcMain.handle('db:update-milestone', (_event, id: number, updates: Partial<Milestone>) => {
    return db.updateMilestone(id, updates)
  })

  ipcMain.handle('db:delete-milestone', (_event, id: number) => {
    return db.deleteMilestone(id)
  })

  // ----- Holidays -----
  ipcMain.handle('db:get-holidays', () => {
    return db.getHolidays()
  })

  ipcMain.handle('db:get-holiday', (_event, id: number) => {
    return db.getHoliday(id)
  })

  ipcMain.handle('db:add-holiday', (_event, holiday: Omit<Holiday, 'id' | 'created_at'>) => {
    return db.addHoliday(holiday)
  })

  ipcMain.handle('db:delete-holiday', (_event, id: number) => {
    return db.deleteHoliday(id)
  })

  ipcMain.handle('db:import-holidays', (_event, holidays: Omit<Holiday, 'id' | 'created_at'>[]) => {
    return db.importHolidays(holidays)
  })

  // ----- Calendar Sources -----
  ipcMain.handle('db:get-calendar-sources', () => {
    return db.getCalendarSources()
  })

  ipcMain.handle('db:get-calendar-source', (_event, id: number) => {
    return db.getCalendarSource(id)
  })

  ipcMain.handle('db:add-calendar-source', (_event, source: Omit<CalendarSource, 'id' | 'created_at' | 'updated_at'>) => {
    return db.addCalendarSource(source)
  })

  ipcMain.handle('db:update-calendar-source', (_event, id: number, updates: Partial<CalendarSource>) => {
    return db.updateCalendarSource(id, updates)
  })

  ipcMain.handle('db:delete-calendar-source', (_event, id: number) => {
    return db.deleteCalendarSource(id)
  })

  // ----- Calendar Sync (New CalendarManager) -----
  ipcMain.handle('calendar:sync', async () => {
    return await calendarManager.fetchExternalEvents()
  })

  ipcMain.handle('calendar:test-url', async (_event, url: string) => {
    return await calendarManager.testCalendarUrl(url)
  })

  // ----- Authentication -----
  ipcMain.handle('auth:google-signin', async () => {
    console.log('[Main] Google sign-in requested')
    
    try {
      // Import googleAuth module dynamically
      const { startAuth } = await import('./googleAuth')
      
      // Start OAuth flow
      const result = await startAuth()
      
      if (result.success) {
        console.log('[Main] Google sign-in successful')
        return { success: true }
      } else {
        console.error('[Main] Google sign-in failed:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      console.error('[Main] Error during Google sign-in:', error)
      return { success: false, error: error.message || 'Unknown error occurred' }
    }
  })

  ipcMain.handle('auth:google-signout', async () => {
    console.log('[Main] Google sign-out requested')
    
    try {
      const { signOut } = await import('./googleAuth')
      signOut()
      console.log('[Main] Google sign-out successful')
      return
    } catch (error) {
      console.error('[Main] Error during Google sign-out:', error)
      throw error
    }
  })

  ipcMain.handle('auth:google-status', async () => {
    try {
      const { isAuthenticated } = await import('./googleAuth')
      return isAuthenticated()
    } catch (error) {
      console.error('[Main] Error checking auth status:', error)
      return false
    }
  })

  ipcMain.handle('auth:google-profile', async () => {
    try {
      const { getUserProfile } = await import('./googleAuth')
      return getUserProfile()
    } catch (error) {
      console.error('[Main] Error getting user profile:', error)
      return null
    }
  })

  ipcMain.handle('calendar:get-google-events', async (_event, start: string, end: string) => {
    console.log('IPC: Received request to fetch Google Events', { start, end })
    try {
      const { getGoogleEvents } = await import('./googleAuth')
      const events = await getGoogleEvents(start, end)
      console.log(`IPC: Returning ${events.length} events to renderer.`)
      return events
    } catch (error) {
      console.error('IPC: Error fetching Google events:', error)
      return []
    }
  })

  ipcMain.handle('calendar:delete-google-event', async (_event, eventId: string) => {
    console.log(`IPC: Received request to delete Google Event ${eventId}`)
    try {
      const { deleteGoogleEvent } = await import('./googleAuth')
      const result = await deleteGoogleEvent(eventId)
      return result
    } catch (error) {
      console.error('IPC: Error deleting Google event:', error)
      throw error
    }
  })

  ipcMain.handle('calendar:save-synced-items', async (_event, items: any[]) => {
    console.log(`IPC: Received request to save ${items.length} synced items`)
    return db.saveSyncedItems(items)
  })

  // ----- Utility -----
  ipcMain.handle('db:get-path', () => {
    return db.getDbPath()
  })



  console.log('[Main] IPC handlers registered successfully')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.magnus.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database (synchronous with better-sqlite3)
  try {
    db = new DatabaseManager()
    db.initialize()
    console.log('[Main] Database initialized successfully')
    
    // Initialize calendar manager
    calendarManager = new CalendarManager(db)
    console.log('[Main] Calendar manager initialized successfully')
    
    // Initialize calendar service for Life OS
    calendarService = new CalendarService(db)
    console.log('[Main] Calendar service initialized successfully')
  } catch (error) {
    console.error('[Main] Failed to initialize database:', error)
  }

  // Setup IPC handlers
  setupIpcHandlers()
  
  // Register calendar handlers for Life OS
  if (calendarService) {
    registerCalendarHandlers(calendarService)
  }

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Close database on exit
  if (db) {
    db.close()
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
