const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');

const hash = bcrypt.hashSync('secret123', 4);

const fakePool = {
  query: jest.fn(async (sql, params) => {
    if (sql.startsWith('INSERT')) return { rows: [{ id: 1, username: params[0], role: params[2] }] };
    return { rows: [{ id: 1, username: 'juan', password_hash: hash, role: 'student' }] };
  }),
};
const app = createApp(fakePool, 'test-secret');

test('GET /health returns 200', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
});

test('register rejects missing fields', async () => {
  const res = await request(app).post('/register').send({ username: 'juan' });
  expect(res.status).toBe(400);
});

test('register creates a user', async () => {
  const res = await request(app).post('/register').send({ username: 'juan', password: 'secret123' });
  expect(res.status).toBe(201);
  expect(res.body.role).toBe('student');
});

test('login with wrong password returns 401', async () => {
  const res = await request(app).post('/login').send({ username: 'juan', password: 'wrong' });
  expect(res.status).toBe(401);
});

test('login with correct password returns a token', async () => {
  const res = await request(app).post('/login').send({ username: 'juan', password: 'secret123' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
});