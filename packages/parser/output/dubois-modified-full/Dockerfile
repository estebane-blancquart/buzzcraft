FROM node:18-alpine

WORKDIR /app

# Install dependencies as root
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Fix permissions for next binary
RUN chmod +x node_modules/.bin/next

# Build the application 
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
