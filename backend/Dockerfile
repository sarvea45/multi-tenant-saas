# Use official Node.js image
FROM node:18-alpine

# Install curl for healthcheck (Mandatory for Step 5)
RUN apk --no-cache add curl

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]