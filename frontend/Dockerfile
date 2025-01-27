# Stage 1: Build environment
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Create production env file
RUN echo "VITE_AUTH_URL=/auth" > .env.production && \
    echo "VITE_API_URL=/api" >> .env.production

# Build
RUN npm run build

# Stage 2: Production environment
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]