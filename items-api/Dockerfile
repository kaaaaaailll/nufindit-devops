FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# test stage: Jenkins runs this with "docker build --target test"
FROM base AS test
RUN npm test

# production stage: small image, no dev dependencies
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=base /app/src ./src
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
USER node
CMD ["node", "src/server.js"]