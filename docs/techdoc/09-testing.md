# 9. Testing Strategy

## 9.1 Overview
We test at two points in the pipeline:
1. **Before deployment (Test stage)**: automated Jest tests for both backend modules. A failure here stops the pipeline.
2. **After deployment (Smoke Test stage)**: a live check that the new version is running and healthy.

## 9.2 Automated tests (10 in total)
The tests use Jest and supertest. They run inside Docker, in the test stage of each API Dockerfile, using the command docker build --target test. The Jenkins machine needs no Node.js.

| Module | File | Test | What it checks |
|---|---|---|---|
| items-api | app.test.js | GET /health returns 200 | Health endpoint answers with status ok |
| items-api | app.test.js | GET /items returns a list | Response is 200 and an array |
| items-api | app.test.js | POST /items rejects missing fields | Missing fields give HTTP 400 |
| items-api | app.test.js | POST /items creates an item | Valid item gives HTTP 201 |
| items-api | validation.test.js | POST /items works without a description | Description is optional, gives HTTP 201 |
| auth-api | app.test.js | GET /health returns 200 | Health endpoint answers |
| auth-api | app.test.js | register rejects missing fields | Missing password gives HTTP 400 |
| auth-api | app.test.js | register creates a user | Gives HTTP 201 and the default role student |
| auth-api | app.test.js | login with wrong password returns 401 | Wrong password is refused |
| auth-api | app.test.js | login with correct password returns a token | Gives HTTP 200 and a JWT token |

Both backend modules have tests, which covers the recommendation to test every backend module.

## 9.3 How the tests are written
Each test file builds the Express app with createApp and passes in a fake database pool (a Jest mock function). The tests therefore check the API logic (status codes, validation, password hashing and token creation) without needing a running database. They are fast and run anywhere.

## 9.4 How a failing test blocks deployment
The Test stage runs before Build Images, Deploy and Smoke Test. If npm test fails inside the Docker build, docker build returns an error, Jenkins marks the stage and the build as failed, and the later stages are skipped. The containers that are already running are not touched.

**Proof (build #8):** we pushed a deliberately failing test (items-api/tests/break.test.js). Jenkins started automatically, failed at the Test stage, and skipped Build Images, Deploy and Smoke Test. The website stayed on Build 7. After the test file was removed, build #9 passed and the site moved to Build 9.

[Insert screenshot: Stage View with build #8 failing at Test]

## 9.5 Smoke test after deployment
After Deploy, the Smoke Test stage runs inside the proxy container. It tries up to 20 times, 5 seconds apart, and passes only when all three checks succeed:
- http://127.0.0.1/ returns a page that contains "Build: <TAG>" (the new version is live)
- http://127.0.0.1/api/items/health answers
- http://127.0.0.1/api/auth/health answers

This tests the real path through the reverse proxy to both APIs. If it never passes, the stage fails and the post section prints the rollback command.

## 9.6 Limitations
- The unit tests mock the database, so the real SQL and the connection to PostgreSQL are covered only indirectly, by the smoke test and the health checks.
- The frontend and the proxy have no automated tests. The smoke test covers them.
- Possible improvements: an integration test against a real test database, and a linter such as ESLint in the Test stage.
