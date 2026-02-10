FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Generate package-lock.json if it doesn't exist, then install
RUN if [ ! -f package-lock.json ]; then npm install --package-lock-only; fi && \
    npm ci --omit=dev
COPY . .
EXPOSE 3005
CMD ["node", "src/index.js"]
