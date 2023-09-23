FROM node:20-alpine AS installer
WORKDIR /app
COPY . .
RUN npm install

FROM installer AS builder
WORKDIR /app
RUN npm run build -w static

FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install fastify undici @fastify/static zod @dnlup/fastify-traps
COPY --from=builder /app/static/server/index.js /app/server/index.mjs
ENV PORT=80
ENTRYPOINT [ "node", "server/index.mjs" ]
