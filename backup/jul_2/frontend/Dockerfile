# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using npm ci for clean installs
# npm ci is generally preferred over npm install in CI/build environments
# as it ensures exact dependency versions from package-lock.json
RUN npm ci

# Copy the rest of the application code
COPY . /app

# Build the application for production
# Output will be in /app/dist
RUN npm run build

# Note: The second stage (copying artifacts) is removed here
# as the Nginx Dockerfile will copy directly from the 'builder' stage.
# This keeps the frontend Dockerfile focused solely on the build process. 