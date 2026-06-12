import { query } from './db';
import fs from 'fs';
import path from 'path';

const KEY = 'data/db';
let initialized = false;

async function initDb() {
  if (initialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS store (
        key VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL
      )
    `);

    // Check if empty, if so seed from db.json
    const countRes = await query('SELECT count(*) FROM store WHERE key = $1', [KEY]);
    if (parseInt(countRes.rows[0].count) === 0) {
      try {
        const dbPath = path.join(process.cwd(), 'data', 'db.json');
        if (fs.existsSync(dbPath)) {
          const data = fs.readFileSync(dbPath, 'utf-8');
          await query('INSERT INTO store (key, data) VALUES ($1, $2)', [KEY, data]);
          console.log('Successfully seeded database with data/db.json');
        }
      } catch (seedErr) {
        console.error('Error auto-seeding db:', seedErr);
      }
    }

    initialized = true;
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export async function readData(): Promise<any> {
  try {
    await initDb();
    const res = await query('SELECT data FROM store WHERE key = $1', [KEY]);
    if (res.rows.length > 0) {
      return res.rows[0].data;
    } else {
      return { puzzles: [], settings: { googleFormUrl: '', teamIdFieldId: '', answerFieldId: '' }, teams: [] };
    }
  } catch (error) {
    console.error("Error reading from PostgreSQL:", error);
    return { puzzles: [], settings: { googleFormUrl: '', teamIdFieldId: '', answerFieldId: '' }, teams: [] };
  }
}

export async function writeData(data: Record<string, unknown>) {
  try {
    await initDb();
    await query(
      'INSERT INTO store (key, data) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET data = $2',
      [KEY, JSON.stringify(data)]
    );
  } catch (error) {
    console.error("Error writing to PostgreSQL:", error);
  }
}
