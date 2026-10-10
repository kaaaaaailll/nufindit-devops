# NUFindIt - Lost and Found

A containerized lost-and-found board, built and deployed automatically with Docker and Jenkins.

Course: BSIT ITE 301 - System Architecture and Integration

## Architecture

| Container | Technology | Role |
|---|---|---|
| proxy | Nginx 1.27 | Single entry point (port 8080); routes / to frontend, /api/items/ to items-api, /api/auth/ to auth-api |
| frontend | Static HTML on Nginx | Post form, item list, build label in footer |
| items-api | Node 20 + Express + pg | GET/POST /items, GET /health |
| auth-api | Node 20 + Express + bcryptjs + jsonwebtoken | POST /register, POST /login, GET /health |
| db | PostgreSQL 16 (Alpine) | Data in named volume db-data |
| jenkins (separate compose) | Jenkins LTS + Docker CLI | CI/CD server on port 8081 |

Network: nufindit-net. Only the proxy publishes a port.

## Prerequisites

Docker Desktop, Git, and a .env file created from .env.example.

## Run the application

    copy .env.example .env
    docker compose up -d --build

Open http://localhost:8080.

## Run Jenkins

    cd infra\jenkins
    docker compose up -d --build
    docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

Open http://localhost:8081, unlock Jenkins, create an admin user, and add a Secret file credential with ID nufindit-env containing your .env.

## Pipeline

Jenkinsfile stages: Checkout, Test, Build Images, Deploy, Smoke Test. Images are tagged with the build number. Secrets come from Jenkins Credentials. A failing test stops the pipeline before Deploy.

## Automatic trigger

The Jenkinsfile uses Poll SCM (H/2 * * * *). A push to main starts a build within about 3 minutes, with no manual action.

## Rollback

    $env:TAG = "7"
    docker compose -p nufindit-devops up -d --no-build

## Team

| Member | Role |
|---|---|
| Aboy, Jean Ice Vincent D. | Infrastructure Engineer |
| Dizon, Kizen Jared D. | Project Lead |
| Flores, Nicole James B. | Frontend, QA, and Documentation Lead |
| Mallari, Ian Rose C. | Backend and Database Engineer |
| Salenillas, Mikhail John Alexis N. | DevOps |

