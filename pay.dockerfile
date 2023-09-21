FROM node:20-alpine AS installer
WORKDIR /app
COPY . .
RUN npm install

FROM installer AS builder
WORKDIR /app
RUN npm run build -w pay

FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install fastify undici @fastify/static zod
COPY --from=builder /app/pay/dist /app/dist
COPY --from=builder /app/pay/server /app/server
ENV PORT=80
ENTRYPOINT [ "node", "server/entry.fastify" ]
