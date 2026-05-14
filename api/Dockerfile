FROM node:20-alpine
WORKDIR /app
COPY api/package.json .
RUN npm install --production
COPY api/ .
COPY frontend/ ./frontend/
COPY widget/ ./widget/
EXPOSE 8001
CMD ["node", "server.js"]
