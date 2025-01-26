# Dockerfile for auth-service
FROM node:18-alpine

WORKDIR /app

# Copy only package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code (including app.js)
COPY . .

# Run your main JS file
CMD ["node", "app.js"]