FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY api/package.json .
RUN npm install --production
COPY api/ .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY widget/ ./widget/
EXPOSE 8001
CMD ["node", "server.js"]
