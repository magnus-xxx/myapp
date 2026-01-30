import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

async function testLifeOSCapabilities() {
  const SQL = await initSqlJs();
  const userDataPath = path.join(process.env.APPDATA || '', 'Magnus');
  const dbPath = path.join(userDataPath, 'magnus.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found at:', dbPath);
    return;
  }

  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // Helper for UUID
  const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

  console.log('--- Step 1: Inserting Polymorphic Items ---');

  const testItems = [
    {
      id: uuid(),
      title: "Quarterly Review",
      type: "task",
      domain: "work",
      status: "todo",
      priority: "high",
      metadata: JSON.stringify({ department: "Strategy", focus: "Q1 Targets" })
    },
    {
      id: uuid(),
      title: "Meditation",
      type: "habit",
      domain: "life",
      status: "todo",
      priority: "medium",
      recurrence_rule: "FREQ=DAILY",
      metadata: JSON.stringify({ streak: 12, best_streak: 20 })
    },
    {
      id: uuid(),
      title: "Buy S&P500",
      type: "event",
      domain: "invest",
      status: "done",
      priority: "medium",
      metadata: JSON.stringify({ ticker: "VOO", amount: 500, currency: "USD" })
    },
    {
      id: uuid(),
      title: "Finish TypeScript Book",
      type: "milestone",
      domain: "study",
      status: "doing",
      priority: "high",
      due_date: "2026-03-01",
      metadata: JSON.stringify({ chapters_read: 5, total_chapters: 12 })
    }
  ];

  for (const item of testItems) {
    db.run(`
      INSERT INTO calendar_items (
        id, title, type, domain, status, priority, 
        due_date, recurrence_rule, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      item.id, item.title, item.type, item.domain, item.status, item.priority,
      item.due_date || null, item.recurrence_rule || null, item.metadata
    ]);
  }

  // Save changes
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log('✅ Test items inserted and saved to disk.');

  console.log('\n--- Step 2: Verifying Retrieval & Metadata Parsing ---');

  const results = db.exec("SELECT title, type, domain, metadata FROM calendar_items WHERE title IN ('Quarterly Review', 'Meditation', 'Buy S&P500', 'Finish TypeScript Book')");
  
  if (results.length > 0 && results[0].values.length > 0) {
    results[0].values.forEach((row, index) => {
      const title = row[0] as string;
      const type = row[1] as string;
      const domain = row[2] as string;
      const metadataStr = row[3] as string;
      
      // Parse metadata back to object
      const metadataObj = JSON.parse(metadataStr);

      console.log(`\n[Item ${index + 1}]`);
      console.log(`Title:    ${title}`);
      console.log(`Type:     ${type}`);
      console.log(`Domain:   ${domain}`);
      console.log(`Metadata:`, metadataObj);
      
      // Critical check for Invest and Habit
      if (title === 'Meditation') {
        if (typeof metadataObj === 'object' && metadataObj.streak === 12) {
          console.log('✅ Habit Streak Check: PASSED');
        } else {
          console.log('❌ Habit Streak Check: FAILED');
        }
      }
      
      if (title === 'Buy S&P500') {
        if (typeof metadataObj === 'object' && metadataObj.ticker === 'VOO') {
          console.log('✅ Invest Ticker Check: PASSED');
        } else {
          console.log('❌ Invest Ticker Check: FAILED');
        }
      }
    });
  } else {
    console.log('❌ No items found in verification query.');
  }

  console.log('\n--- Summary statistics of calendar_items ---');
  const stats = db.exec("SELECT type, domain, COUNT(*) FROM calendar_items GROUP BY type, domain");
  if (stats.length > 0) {
    stats[0].values.forEach(v => {
      console.log(`- ${v[0]} (${v[1]}): ${v[2]}`);
    });
  }
}

testLifeOSCapabilities().catch(console.error);
