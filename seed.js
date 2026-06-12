require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Render PostgreSQL');

    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS store (
        key VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL
      )
    `);

    // Read the db.json
    const dbPath = path.join(__dirname, 'data', 'db.json');
    if (!fs.existsSync(dbPath)) {
        console.log('db.json not found, skipping seed.');
        return;
    }
    const data = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(data);

    // Insert data
    await client.query(
      'INSERT INTO store (key, data) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET data = $2',
      ['data/db', JSON.stringify(parsed)]
    );

    console.log('Database successfully seeded with data/db.json!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await client.end();
  }
}

seed();
