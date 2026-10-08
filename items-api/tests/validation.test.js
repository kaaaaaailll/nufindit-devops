const request = require('supertest');
const { createApp } = require('../src/app');

const fakePool = {
  query: jest.fn(async () => ({ rows: [{ id: 1, name: 'Keys' }] })),
};
const app = createApp(fakePool);

test('POST /items works without a description', async () => {
  const res = await request(app).post('/items').send({
    name: 'Keys', category: 'Accessories', location: 'Library', postedBy: 'student1',
  });
  expect(res.status).toBe(201);
});
