# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --ignore-engines

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Verify build output
RUN ls -la dist/

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a simple index.html to view the extension files
RUN echo '<!DOCTYPE html><html><head><title>Maskophilia Extension</title></head><body><h1>Maskophilia Browser Extension</h1><p>Build completed successfully!</p><ul><li><a href="popup.js">Popup Script</a></li><li><a href="content.js">Content Script</a></li><li><a href="background.js">Background Script</a></li></ul></body></html>' > /usr/share/nginx/html/index.html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 