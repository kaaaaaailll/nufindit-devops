const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createApp(pool, jwtSecret) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.post('/register', async (req, res) => {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const userRole = role === 'sdao' ? 'sdao' : 'student';
    try {
      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
        [username, hash, userRole]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'username already taken' });
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    try {
      const result = await pool.query(
        'SELECT id, username, password_hash, role FROM users WHERE username = $1',
        [username]
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'invalid credentials' });
      }
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '8h' });
      res.json({ token, username: user.username, role: user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return app;
}

module.exports = { createApp };