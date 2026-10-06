const { Pool } = require('pg');
const { createApp } = require('./app');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nufindit',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMP DEFAULT NOW()
    )`);
}

init()
  .then(() => {
    createApp(pool, process.env.JWT_SECRET).listen(3001, () => console.log('auth-api listening on 3001'));
  })
  .catch((err) => {
    console.error('Failed to start', err);
    process.exit(1);
  });