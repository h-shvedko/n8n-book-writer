# MCP Coder Server Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Install all dependencies, build, then prune dev deps
RUN npm install && \
    npm run build && \
    npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

# Switch to non-root user
USER mcp

# Expose port for HTTP mode
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Default to HTTP mode for Docker
ENV MCP_MODE=http
ENV PORT=3004
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
