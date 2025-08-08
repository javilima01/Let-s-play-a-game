# 1. Build stage: npm install & build React (Vite)
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build      # outputs to /app/dist

# 2. Production stage: serve with NGINX
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Remove default NGINX site
RUN rm /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=build /app/dist .

# Copy custom server block
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]