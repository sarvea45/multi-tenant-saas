# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the React application
RUN npm run build

# Install a lightweight static server to serve the build
RUN npm install -g serve

# Expose the frontend port
EXPOSE 3000

# Start the static server on port 3000
CMD ["serve", "-s", "build", "-l", "3000"]