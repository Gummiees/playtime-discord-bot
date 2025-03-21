# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using clean install
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
RUN npm ci --only=production

# Copy service account key and set environment variable
COPY service-account-key.json /app/service-account-key.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json

COPY . .

CMD ["npm", "start"]
