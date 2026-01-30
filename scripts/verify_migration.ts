import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

async function runMigrationAndVerify() {
  const SQL = await initSqlJs();
  const userDataPath = path.join(process.env.APPDATA || '', 'Magnus');
  const dbPath = path.join(userDataPath, 'magnus.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    return;
  }

  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // BASE TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS calendar_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('event', 'task', 'milestone', 'habit')),
      domain TEXT NOT NULL CHECK(domain IN ('work', 'life', 'study', 'invest')),
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'doing', 'done')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      project_id TEXT,
      start_time TEXT,
      end_time TEXT,
      due_date TEXT,
      estimate_minutes INTEGER,
      actual_minutes INTEGER,
      recurrence_rule TEXT,
      metadata TEXT DEFAULT '{}',
      color TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

  const mapCategoryToDomain = (cat: any) => {
    const c = String(cat || '').toLowerCase();
    if (c.includes('work') || c.includes('meeting')) return 'work';
    if (c.includes('study') || c.includes('learn')) return 'study';
    if (c.includes('invest') || c.includes('finance')) return 'invest';
    return 'life';
  };

  const mapTaskStatus = (status: any) => {
    const s = String(status || '').toLowerCase();
    if (s === 'done') return 'done';
    if (s === 'in_progress' || s === 'doing') return 'doing';
    return 'todo';
  };

  console.log('--- 1. ETL Migration ---');
  
  // Clear if needed for a fresh run if we want to re-run
  // db.run("DELETE FROM calendar_items");
  // db.run("DELETE FROM settings WHERE key = 'calendar_items_migration_v1'");

  const migrationCheck = db.exec(`SELECT value FROM settings WHERE key = 'calendar_items_migration_v1'`);
  if (migrationCheck.length === 0 || migrationCheck[0].values.length === 0) {
    console.log('Running migration...');
    
    // EVENTS
    try {
      const events = db.exec(`SELECT id, title, description, start_time, end_time, category, color, type, status, priority, created_at, updated_at FROM events`);
      if (events.length > 0) {
        console.log(`Migrating ${events[0].values.length} events...`);
        events[0].values.forEach(row => {
          db.run(`INSERT INTO calendar_items (id, title, description, type, domain, status, priority, start_time, end_time, color, metadata, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                  [generateUUID(), row[1], row[2], 'event', mapCategoryToDomain(row[5]), row[8] || 'todo', row[9] || 'medium', row[3], row[4], row[6], 
                   JSON.stringify({ migrated_from: 'events', original_id: row[0], legacy_category: row[5] }),
                   row[10] || new Date().toISOString(), row[11] || new Date().toISOString()]);
        });
      }
    } catch(e) { console.log('Events migration failed or skipped:', e.message); }

    // TASKS
    try {
      const tasks = db.exec(`SELECT id, title, description, status, priority, due_date, client_project, eisenhower_quadrant, milestone_id, subtasks, recurrence, tags, created_at, updated_at FROM tasks`);
      if (tasks.length > 0) {
        console.log(`Migrating ${tasks[0].values.length} tasks...`);
        tasks[0].values.forEach(row => {
          db.run(`INSERT INTO calendar_items (id, title, description, type, domain, status, priority, due_date, recurrence_rule, metadata, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                  [generateUUID(), row[1], row[2], 'task', row[6] ? 'work' : 'life', mapTaskStatus(row[3]), row[4] || 'medium', row[5], row[10],
                   JSON.stringify({ 
                     migrated_from: 'tasks', 
                     original_id: row[0],
                     eisenhower_quadrant: row[7],
                     subtasks: row[9] ? JSON.parse(row[9] as string) : [],
                     tags: row[11] ? JSON.parse(row[11] as string) : []
                   }),
                   row[12] || new Date().toISOString(), row[13] || new Date().toISOString()]);
        });
      }
    } catch(e) { console.log('Tasks migration failed or skipped:', e.message); }

    db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('calendar_items_migration_v1', 'completed')`);
    
    // EXPORT
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    console.log('✅ Migration data saved.');
  } else {
    console.log('✅ Migration already marked as complete.');
  }

  console.log('\n--- 2. Results ---');
  const countRes = db.exec("SELECT type, COUNT(*) FROM calendar_items GROUP BY type");
  if (countRes.length > 0) {
    console.log('By Type:');
    countRes[0].values.forEach(v => console.log(`  - ${v[0]}: ${v[1]}`));
  }

  const domainRes = db.exec("SELECT domain, COUNT(*) FROM calendar_items GROUP BY domain");
  if (domainRes.length > 0) {
    console.log('By Domain:');
    domainRes[0].values.forEach(v => console.log(`  - ${v[0]}: ${v[1]}`));
  }

  console.log('\n--- 3. Metadata Content Verification ---');
  const samples = db.exec("SELECT title, type, metadata FROM calendar_items WHERE metadata != '{}' LIMIT 3");
  if (samples.length > 0) {
    samples[0].values.forEach((v, i) => {
      console.log(`Sample ${i+1} (${v[1]}): ${v[0]}`);
      console.log(`   Metadata: ${v[2]}`);
    });
  }
}

runMigrationAndVerify().catch(console.error);
