# Containerized Infrastructure and CI/CD Automation using Docker and Jenkins

**Project:** NUFindIt (Lost-and-Found Board)
**Course:** BSIT ITE 301, System Architecture and Integration
**Group name:** [FILL IN GROUP NAME]
**Repository:** https://github.com/kaaaaaailll/nufindit-devops

## 1. Team Members and Roles

| Member | Role |
|---|---|
| Salenillas, Mikhail John Alexis N. | DevOps / CI-CD Engineer |
| Aboy, Jean Ice Vincent D. | Infrastructure Engineer |
| Dizon, Kizen Jared D. | Project Lead |
| Mallari, Ian Rose C. | Backend and Database Engineer |
| Flores, Nicole James B. | Frontend, QA, and Documentation Lead |

## 2. Project Description and Modules

NUFindIt is a small lost-and-found board where users register, log in, and post found or lost items. The application itself is deliberately simple. The focus of the project is the infrastructure: every module runs in its own Docker container, and Jenkins builds, tests, and deploys the whole system automatically on every push to GitHub.

| Module | Purpose | Port (internal) |
|---|---|---|
| proxy | Nginx reverse proxy. The only service published to the host (8080). Routes / to the frontend, /api/items/ to items-api, /api/auth/ to auth-api. | 80 |
| frontend | Static HTML page served by Nginx. The footer shows the build number ("Build: N"), which proves which version is live. | 80 |
| items-api | Node.js 20 + Express REST API. Endpoints: GET /health, GET /items, POST /items. Stores data in PostgreSQL. Covered by Jest tests. | 3000 |
| auth-api | Node.js 20 + Express API using bcryptjs and jsonwebtoken. Endpoints: GET /health, POST /register, POST /login. Covered by 5 Jest tests. | 3001 |
| db | PostgreSQL 16 (alpine), built from ./db. Data is kept in the named volume db-data. | 5432 |
| jenkins | Separate Compose stack in infra/jenkins/. Runs the CI/CD pipeline. UI at http://localhost:8081. | 8080 (mapped to 8081) |

All application modules share one user-defined Docker network (nufindit-net). Only the proxy is reachable from outside; the APIs and the database are not exposed to the host.
