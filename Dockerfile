FROM node:22-bookworm-slim AS unpack
RUN apt-get update \
 && apt-get install -y --no-install-recommends unzip coreutils \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /src
COPY .import /archive
RUN cat /archive/chunk-*.b64 | tr -d '[:space:]' | base64 -d > /tmp/app.zip \
 && echo "51aaaa605e0a7b7f98cdc86994142d0f274fd6610c6e5ef878d77fceca744dbc  /tmp/app.zip" | sha256sum -c - \
 && unzip -q /tmp/app.zip -d /src

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=unpack /src/package*.json ./
RUN npm ci --no-audit --no-fund
COPY --from=unpack /src/tsconfig.json ./
COPY --from=unpack /src/src ./src
COPY --from=unpack /src/public ./public
COPY --from=unpack /src/data ./data
COPY --from=unpack /src/scripts ./scripts
COPY --from=unpack /src/tests ./tests
RUN npm test && npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/data ./data
COPY --from=build --chown=node:node /app/scripts ./scripts
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh","-c","node scripts/check-env.mjs; exec node dist/src/server.js"]
