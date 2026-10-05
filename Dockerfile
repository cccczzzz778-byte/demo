FROM node:22-bookworm-slim
WORKDIR /app
ENV CI=true
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
COPY source.b64.part* /tmp/
RUN cat /tmp/source.b64.part* | base64 -d | tar -xz -C /app \
  && rm /tmp/source.b64.part*
RUN npm install
RUN npm run build
RUN npm run test --workspace @buxoro-ssb/web -- --run --globals \
  && npm run test --workspace @buxoro-ssb/api -- --run --globals
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
