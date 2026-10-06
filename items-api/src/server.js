const { Pool } = require('pg');
const { createApp } = require('./app');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nufindit',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT DEFAULT '',
      posted_by TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
}

init()
  .then(() => {
    createApp(pool).listen(3000, () => console.log('items-api listening on 3000'));
  })
  .catch((err) => {
    console.error('Failed to start', err);
    process.exit(1);
  });