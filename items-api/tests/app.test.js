const request = require('supertest');
const { createApp } = require('../src/app');

const fakePool = {
  query: jest.fn(async (sql, params) => {
    if (sql.startsWith('INSERT')) return { rows: [{ id: 1, name: params[0] }] };
    return { rows: [{ id: 1, name: 'Black wallet' }] };
  }),
};
const app = createApp(fakePool);

test('GET /health returns 200', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('GET /items returns a list', async () => {
  const res = await request(app).get('/items');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('POST /items rejects missing fields', async () => {
  const res = await request(app).post('/items').send({ name: 'Keys' });
  expect(res.status).toBe(400);
});

test('POST /items creates an item', async () => {
  const res = await request(app).post('/items').send({
    name: 'Keys', category: 'Accessories', location: 'Library', postedBy: 'student1',
  });
  expect(res.status).toBe(201);
});