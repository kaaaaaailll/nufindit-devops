# 5. Dockerfile Explanations

Every module we wrote has its own Dockerfile and its own .dockerignore (items-api, auth-api, frontend, proxy, db). Only the Jenkins image (infra/jenkins) is covered in Section 7.

## 5.1 Summary

| Module | Base image | Multi-stage | Non-root user | HEALTHCHECK |
|---|---|---|---|---|
| items-api | node:20-alpine | Yes (base, test, production) | Yes (USER node) | Yes (port 3000) |
| auth-api | node:20-alpine | Yes (base, test, production) | Yes (USER node) | Yes (port 3001) |
| frontend | nginx:1.27-alpine | No | No (default nginx user setup) | No (checked by the smoke test) |
| proxy | nginx:1.27-alpine | No | No (default nginx user setup) | No (checked by the smoke test) |
| db | postgres:16-alpine | No | No (image default) | In docker-compose.yml (Section 6) |

## 5.2 items-api and auth-api (multi-stage)
The two APIs use the same structure. Only the port differs (3000 and 3001).

- **base stage**: starts from node:20-alpine, sets WORKDIR /app, copies package*.json first and runs npm ci, then copies the rest of the code. Copying the dependency files first lets Docker reuse the cached npm ci layer when only source code changes, so builds are faster.
- **test stage**: FROM base, then RUN npm test. Jenkins runs docker build --target test. If any Jest test fails, the build fails and the pipeline stops before Deploy. Because the tests run inside Docker, the Jenkins machine needs no Node.js installed.
- **production stage**: a fresh node:20-alpine image. It sets NODE_ENV=production, runs npm ci --omit=dev (no test tools), and copies only the src folder from the base stage. The image therefore contains no tests and no dev dependencies, which makes it smaller.
- **Security**: USER node runs the app as the non-root user that the Node image provides.
- **HEALTHCHECK**: every 15 seconds the container runs wget against /health on its own port. Docker marks the container healthy or unhealthy, and docker compose ps shows it.
- **CMD**: node src/server.js starts the service.

## 5.3 frontend
FROM nginx:1.27-alpine with a build argument BUILD_NUMBER (default dev). The Dockerfile copies index.html into the nginx web root, then a sed command replaces the placeholder __BUILD__ with the build number. This is how the footer shows "Build: <number>". docker-compose.yml passes TAG as the build argument, so the footer proves which version is live.

## 5.4 proxy
FROM nginx:1.27-alpine, then nginx.conf is copied to /etc/nginx/conf.d/default.conf. The configuration is baked into the image, not bind-mounted, so it works the same when Jenkins deploys. The proxy routes / to the frontend, /api/items/ to items-api and /api/auth/ to auth-api.

## 5.5 db
FROM postgres:16-alpine, then init.sql is copied to /docker-entrypoint-initdb.d/. The official image runs that script once, on first start, when the data directory is empty. Because the script is copied into the image, no bind mount of ./db/init.sql is needed. This fixed a problem that appeared when Jenkins deployed from its own workspace (Section 11). The data itself lives in the named volume db-data, so it survives redeployments.

## 5.6 Choices and limitations
- **Pinned versions**: node:20-alpine, nginx:1.27-alpine and postgres:16-alpine are pinned to a major or minor version. None uses :latest. A major-version tag can still receive security patches, so it is not a byte-exact pin. A digest would be exact.
- **Alpine**: small images with fewer packages, so a smaller attack surface.
- **.dockerignore**: each module excludes files that should not enter the build context (for example node_modules and local files), which keeps builds fast and keeps local files out of the image.
- **Limitations**: the frontend, proxy and db images use the default users of their official images and have no HEALTHCHECK in the Dockerfile. The APIs, which hold our own code, have both. Possible improvements: a non-root nginx image and a Dockerfile HEALTHCHECK for the proxy.
