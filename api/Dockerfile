FROM oven/bun:1 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY api/package.json api/bun.lock ./
RUN bun install --frozen-lockfile --production
COPY api/ .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY widget/ ./widget/
EXPOSE 8001
CMD ["bun", "server.js"]
