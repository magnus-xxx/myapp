import { DatabaseManager } from '../DatabaseManager'
import { CalendarItem, ItemType, ItemDomain } from '../../shared/types'

/**
 * CalendarService - Business logic layer for polymorphic calendar items
 * Handles CRUD operations for the unified Life OS calendar system
 */
export class CalendarService {
  constructor(private db: DatabaseManager) {}

  /**
   * Generate UUID v4 for new calendar items
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * Parse metadata from JSON string to object
   */
  private parseMetadata(metadataStr: string | null | undefined): any {
    if (!metadataStr) return {}
    try {
      return JSON.parse(metadataStr)
    } catch (e) {
      console.error('[CalendarService] Failed to parse metadata:', e)
      return {}
    }
  }

  /**
   * Get calendar items with flexible filtering
   */
  async getCalendarItems(filters?: {
    startDate?: Date
    endDate?: Date
    domains?: ItemDomain[]
    types?: ItemType[]
    projectId?: string
    status?: string
  }): Promise<CalendarItem[]> {
    const dbInstance = (this.db as any).db
    if (!dbInstance) {
      throw new Error('Database not initialized')
    }

    // Build WHERE clauses
    const whereClauses: string[] = []
    const params: any[] = []

    if (filters?.domains && filters.domains.length > 0) {
      whereClauses.push(`domain IN (${filters.domains.map(() => '?').join(',')})`)
      params.push(...filters.domains)
    }

    if (filters?.types && filters.types.length > 0) {
      whereClauses.push(`type IN (${filters.types.map(() => '?').join(',')})`)
      params.push(...filters.types)
    }

    if (filters?.projectId) {
      whereClauses.push('project_id = ?')
      params.push(filters.projectId)
    }

    if (filters?.status) {
      whereClauses.push('status = ?')
      params.push(filters.status)
    }

    // Date filtering (for events with start_time or tasks with due_date)
    if (filters?.startDate) {
      whereClauses.push('(start_time >= ? OR due_date >= ?)')
      const dateStr = filters.startDate.toISOString()
      params.push(dateStr, dateStr)
    }

    if (filters?.endDate) {
      whereClauses.push('(start_time <= ? OR due_date <= ?)')
      const dateStr = filters.endDate.toISOString()
      params.push(dateStr, dateStr)
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const query = `
      SELECT 
        id, title, description, type, domain, status, priority,
        project_id, start_time, end_time, due_date,
        estimate_minutes, actual_minutes, recurrence_rule,
        metadata, color, created_at, updated_at,
        is_synced, timezone, is_all_day,
        date, startTime, endTime
      FROM calendar_items
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN start_time IS NOT NULL THEN start_time
          WHEN due_date IS NOT NULL THEN due_date
          ELSE created_at
        END ASC
    `

    const result = dbInstance.exec(query, params)

    if (result.length === 0 || result[0].values.length === 0) {
      return []
    }

    return result[0].values.map((row: any[]) => {
      const metadata = this.parseMetadata(row[14])
      return {
        id: row[0],
        title: row[1],
        description: row[2] || undefined,
        type: row[3] as ItemType,
        domain: row[4] as ItemDomain,
        status: row[5],
        priority: row[6],
        project_id: row[7] || undefined,
        start_time: row[8] || undefined,
        end_time: row[9] || undefined,
        due_date: row[10] || undefined,
        estimate_minutes: row[11] || undefined,
        actual_minutes: row[12] || undefined,
        recurrence_rule: row[13] || undefined,
        metadata: metadata,
        color: row[15] || undefined,
        created_at: row[16],
        updated_at: row[17],
        
        isSynced: row[18] === 1,
        timezone: row[19] || undefined,
        is_all_day: row[20] === 1,

        // Flatten metadata/columns helper fields for UI
        date: row[21] || metadata.date,
        startTime: row[22] || metadata.startTime,
        endTime: row[23] || metadata.endTime,
        googleEventId: metadata.googleEventId,
        googleCalendarId: metadata.googleCalendarId
      }
    })
  }

  /**
   * Get a single calendar item by ID
   */
  async getCalendarItem(id: string): Promise<CalendarItem | null> {
    const dbInstance = (this.db as any).db
    if (!dbInstance) {
      throw new Error('Database not initialized')
    }

    const result = dbInstance.exec(
      `SELECT 
        id, title, description, type, domain, status, priority,
        project_id, start_time, end_time, due_date,
        estimate_minutes, actual_minutes, recurrence_rule,
        metadata, color, created_at, updated_at
      FROM calendar_items
      WHERE id = ?`,
      [id]
    )

    if (result.length === 0 || result[0].values.length === 0) {
      return null
    }

    const row = result[0].values[0]
    return {
      id: row[0],
      title: row[1],
      description: row[2] || undefined,
      type: row[3] as ItemType,
      domain: row[4] as ItemDomain,
      status: row[5],
      priority: row[6],
      project_id: row[7] || undefined,
      start_time: row[8] || undefined,
      end_time: row[9] || undefined,
      due_date: row[10] || undefined,
      estimate_minutes: row[11] || undefined,
      actual_minutes: row[12] || undefined,
      recurrence_rule: row[13] || undefined,
      metadata: this.parseMetadata(row[14]),
      color: row[15] || undefined,
      created_at: row[16],
      updated_at: row[17]
    }
  }

  /**
   * Create a new calendar item
   */
  async createCalendarItem(
    data: Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CalendarItem> {
    const dbInstance = (this.db as any).db
    if (!dbInstance) {
      throw new Error('Database not initialized')
    }

    const id = this.generateUUID()
    const now = new Date().toISOString()
    const metadataStr = JSON.stringify(data.metadata || {})

    dbInstance.run(
      `INSERT INTO calendar_items (
        id, title, description, type, domain, status, priority,
        project_id, start_time, end_time, due_date,
        estimate_minutes, actual_minutes, recurrence_rule,
        metadata, color, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title,
        data.description || null,
        data.type,
        data.domain,
        data.status,
        data.priority,
        data.project_id || null,
        data.start_time || null,
        data.end_time || null,
        data.due_date || null,
        data.estimate_minutes || null,
        data.actual_minutes || null,
        data.recurrence_rule || null,
        metadataStr,
        data.color || null,
        now,
        now
      ]
    )

    // Save to disk
    ;(this.db as any).save()

    return {
      ...data,
      id,
      metadata: data.metadata || {},
      created_at: now,
      updated_at: now
    }
  }

  /**
   * Update an existing calendar item (supports partial updates)
   */
  async updateCalendarItem(
    id: string,
    updates: Partial<Omit<CalendarItem, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<CalendarItem | null> {
    const dbInstance = (this.db as any).db
    if (!dbInstance) {
      throw new Error('Database not initialized')
    }

    // Get existing item to merge metadata
    const existing = await this.getCalendarItem(id)
    if (!existing) {
      return null
    }

    // Merge metadata if provided
    let finalMetadata = existing.metadata || {}
    if (updates.metadata) {
      finalMetadata = { ...finalMetadata, ...updates.metadata }
    }

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
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.domain !== undefined) {
      fields.push('domain = ?')
      values.push(updates.domain)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?')
      values.push(updates.priority)
    }
    if (updates.project_id !== undefined) {
      fields.push('project_id = ?')
      values.push(updates.project_id)
    }
    if (updates.start_time !== undefined) {
      fields.push('start_time = ?')
      values.push(updates.start_time)
    }
    if (updates.end_time !== undefined) {
      fields.push('end_time = ?')
      values.push(updates.end_time)
    }
    if (updates.due_date !== undefined) {
      fields.push('due_date = ?')
      values.push(updates.due_date)
    }
    if (updates.estimate_minutes !== undefined) {
      fields.push('estimate_minutes = ?')
      values.push(updates.estimate_minutes)
    }
    if (updates.actual_minutes !== undefined) {
      fields.push('actual_minutes = ?')
      values.push(updates.actual_minutes)
    }
    if (updates.recurrence_rule !== undefined) {
      fields.push('recurrence_rule = ?')
      values.push(updates.recurrence_rule)
    }
    if (updates.color !== undefined) {
      fields.push('color = ?')
      values.push(updates.color)
    }

    // Always update metadata and updated_at
    fields.push('metadata = ?')
    values.push(JSON.stringify(finalMetadata))

    const now = new Date().toISOString()
    fields.push('updated_at = ?')
    values.push(now)

    values.push(id)

    if (fields.length === 0) {
      return existing
    }

    dbInstance.run(`UPDATE calendar_items SET ${fields.join(', ')} WHERE id = ?`, values)

    // Save to disk
    ;(this.db as any).save()

    // Return updated item
    return this.getCalendarItem(id)
  }

  /**
   * Delete a calendar item
   */
  async deleteCalendarItem(id: string): Promise<boolean> {
    const dbInstance = (this.db as any).db
    if (!dbInstance) {
      throw new Error('Database not initialized')
    }

    dbInstance.run('DELETE FROM calendar_items WHERE id = ?', [id])

    // Save to disk
    ;(this.db as any).save()

    return true
  }
}
