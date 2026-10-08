# Testing Notes

- items-api: 4 Jest tests (health, list, validation, create).
- auth-api: 5 Jest tests (health, validation, register, login failure, login success).
- Tests run inside Docker with: docker build --target test
- A failing test stops the Jenkins pipeline at the Test stage, so broken code is never deployed.
- Smoke test: after deploy, the pipeline checks the page for "Build: <number>" and the /health endpoints through the proxy.
- Manual QA: open http://localhost:8080, post an item, refresh, and confirm it appears.
localhost
Compose
Write to Mikhail Alexis
