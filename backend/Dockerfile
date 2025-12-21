FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

# Install curl for healthcheck
RUN apk --no-cache add curl

CMD ["node", "src/server.js"]