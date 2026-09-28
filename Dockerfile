FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy client and server (Workspaces)
COPY client ./client
COPY server ./server

# Install all dependencies
RUN npm install

# Build the React client
WORKDIR /app/client
RUN npm run build

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Copy built client from builder stage
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server

# Install only production dependencies
RUN npm install --omit=dev

# Expose port
EXPOSE 5000

# Start the Express server
WORKDIR /app/server
CMD ["node", "server.js"]
