FROM node:20-alpine
WORKDIR /app
COPY api/package.json .
RUN npm install --production
COPY api/ .
COPY frontend/ ./frontend/
EXPOSE 8001
CMD ["node", "server.js"]
