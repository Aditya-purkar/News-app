# Stage 1: Compile the React application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the compiled static assets using NGINX
FROM nginx:alpine
# Copy the compiled static assets from Vite's output folder to NGINX HTML root
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy standard NGINX routing rules to handle Single Page Application routing
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]