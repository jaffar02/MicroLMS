# Stage 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve stage
FROM nginx:alpine
# 👇 Copy your compiled assets over to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# 👇 Add this line to load your custom router routing rule
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]