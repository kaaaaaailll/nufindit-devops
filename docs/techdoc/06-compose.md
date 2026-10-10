# 6. Docker Compose Explanation

One file, docker-compose.yml, describes the whole application stack. One command starts everything: `docker compose up -d --build`. Jenkins uses the same file with `docker compose up -d --no-build`. Jenkins itself is in a separate compose file (Section 7).

## 6.1 Services

| Service | Image name | Built from | Published port | Depends on |
|---|---|---|---|---|
| proxy | nufindit/proxy:${TAG:-dev} | ./proxy | 8080 to 80 | frontend, items-api, auth-api (start order only) |
| frontend | nufindit/frontend:${TAG:-dev} | ./frontend (build arg BUILD_NUMBER) | none | none |
| items-api | nufindit/items-api:${TAG:-dev} | ./items-api, target production | none | db (service_healthy) |
| auth-api | nufindit/auth-api:${TAG:-dev} | ./auth-api, target production | none | db (service_healthy) |
| db | built from ./db, no explicit image tag | ./db | none | none |

Only the proxy publishes a port (8080 on the host). The APIs, the frontend and the database are reachable only inside the Docker network, so the database is never exposed to the host or the public.

## 6.2 Image tags and rollback
Every application image is named nufindit/<service>:${TAG:-dev}. Jenkins sets TAG to the build number, so build 22 produces nufindit/items-api:22 and so on. Without TAG the default is dev. Old tags stay on the machine, so a rollback is one command:

`$env:TAG="18"; docker compose -p nufindit-devops up -d --no-build`

The frontend receives TAG as the build argument BUILD_NUMBER, so the page footer shows "Build: <TAG>".
Note: the db service has no image: line, so its image is not tagged by build number. A rollback changes the application services, not the db image. The data stays in the db-data volume.

## 6.3 Startup order and health checks
- items-api and auth-api use `depends_on` with `condition: service_healthy`. They start only after the db health check passes.
- The db health check runs `pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}` every 10 seconds, with a 5 second timeout and 10 retries. The double $$ stops Compose from substituting the variable, so the container's own environment value is used.
- The two APIs also have a HEALTHCHECK inside their Dockerfiles (Section 5). docker compose ps shows db, items-api and auth-api as healthy.
- The proxy lists frontend, items-api and auth-api in a plain depends_on list. That only controls the start order. It does not wait for those services to be healthy.

## 6.4 Network
All five services are attached to one user-defined bridge network, nufindit-net. Compose adds the project name, so it appears in Docker as nufindit-devops_nufindit-net. Containers reach each other by service name (for example the API connects to host db, and the proxy forwards to items-api). Jenkins is on its own network, jenkins_default.

## 6.5 Volume and persistence
The named volume db-data is mounted at /var/lib/postgresql/data in the db container. Docker shows it as nufindit-devops_db-data. The volume is separate from the container, so records survive `docker compose down`, redeployments by Jenkins and rollbacks. Only `docker compose down -v` would delete it, so we never use -v.

## 6.6 Environment variables and secrets
| Variable | Used by | Purpose |
|---|---|---|
| DB_NAME | db, items-api, auth-api | Database name |
| DB_USER | db, items-api, auth-api | Database user |
| DB_PASSWORD | db, items-api, auth-api | Database password |
| JWT_SECRET | auth-api | Signing key for login tokens |
| TAG | all built images, frontend | Image tag and build number shown in the footer |

DB_HOST is fixed to db in the compose file because that is the service name on the network. The real values are in .env, which is listed in .gitignore and is never committed. The repository contains .env.example with placeholder values. In the pipeline, Jenkins copies the Secret file credential nufindit-env to .env for the run and deletes it afterwards.

## 6.7 Restart policy and project name
Every service has `restart: unless-stopped`, so the stack comes back after Docker Desktop or the laptop restarts. We saw this happen: the containers started again on their own. No service uses container_name, and we always pass the project name with `-p nufindit-devops`, so every command manages the same stack.
