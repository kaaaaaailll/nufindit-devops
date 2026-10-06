const express = require('express');

function createApp(pool) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.get('/items', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, name, category, location, description, posted_by AS "postedBy", created_at FROM items ORDER BY id DESC'
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/items', async (req, res) => {
    const { name, category, location, description, postedBy } = req.body || {};
    if (!name || !category || !location || !postedBy) {
      return res.status(400).json({ error: 'name, category, location and postedBy are required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO items (name, category, location, description, posted_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, category, location, description, posted_by AS "postedBy", created_at`,
        [name, category, location, description || '', postedBy]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return app;
}

module.exports = { createApp };