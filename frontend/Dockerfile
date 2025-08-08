# 1. Build stage: npm install & build React (Vite)
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build      # outputs to /app/dist

# 2. Production stage: serve with NGINX + baked-in certs
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Remove default NGINX site
RUN rm /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=build /app/dist .

# Copy your nginx config
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy in your certs (adjust names to match your files)
# Put fullchain.pem and privkey.pem in a local ssl/ directory
COPY ssl/fullchain.pem  /etc/nginx/ssl/fullchain.pem
COPY ssl/privkey.pem    /etc/nginx/ssl/privkey.pem

# Expose both HTTP & HTTPS
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
