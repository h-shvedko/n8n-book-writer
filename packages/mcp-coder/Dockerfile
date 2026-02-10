FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN if [ ! -f package-lock.json ]; then npm install --package-lock-only; fi && \
    npm ci --omit=dev
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]
