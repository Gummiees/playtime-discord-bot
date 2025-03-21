# Discord Bot Deployment Guide

This guide documents the process of deploying a Discord bot to a Google Cloud VM instance.

## Prerequisites

1. A Google Cloud project with:
   - A VM instance running Ubuntu
   - Firebase project set up
   - Service account with necessary permissions
2. Docker installed locally and on the VM
3. Google Cloud SDK installed locally
4. Node.js project with all dependencies

## Configuration Files

### 1. config.json
```json
{
  "token": "your-discord-bot-token",
  "clientId": "your-discord-client-id"
}
```

### 2. service-account-key.json
- Download from Google Cloud Console
- Place in project root directory
- Contains Firebase service account credentials

### 3. Dockerfile
```dockerfile
FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY service-account-key.json /app/service-account-key.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json

COPY . .

CMD ["npm", "start"]
```

## Deployment Steps

### 1. Build Docker Image

Since we're building on an M1/M2 Mac (ARM) for an AMD64 target, we use Docker's buildx feature:

```bash
# Create and use a new builder instance
docker buildx create --use

# Build the image for AMD64 platform
docker buildx build --platform linux/amd64 -t discord-bot . --load
```

### 2. Save Docker Image

```bash
# Save the image to a tar file
docker save discord-bot > discord-bot.tar
```

### 3. Copy to VM

```bash
# Copy the tar file to the VM
gcloud compute scp discord-bot.tar INSTANCE_NAME:~/ --zone ZONE_NAME
```

### 4. Deploy on VM

```bash
# Load the image and run the container
gcloud compute ssh INSTANCE_NAME --zone ZONE_NAME --command "docker load < discord-bot.tar && docker run -d --restart always --name discord-bot discord-bot"
```

### 5. Verify Deployment

```bash
# Check container logs
gcloud compute ssh INSTANCE_NAME --zone ZONE_NAME --command "docker logs discord-bot"
```

Expected output:
```
> your-project-name@1.0.0 start
> node index.js

Firebase initialized!
Ready! Logged in as Your Bot Name#XXXX
```

## Troubleshooting

### Platform Mismatch
If you encounter platform mismatch errors:
1. Ensure you're using `--platform=linux/amd64` in the Dockerfile
2. Use `docker buildx` for cross-platform builds

### Container Issues
If the container fails to start:
1. Check logs: `docker logs discord-bot`
2. Verify environment variables are set correctly
3. Ensure service account key is properly copied
4. Check network connectivity and firewall rules

### Firebase Authentication
If Firebase fails to initialize:
1. Verify service account key is valid
2. Check Firebase project permissions
3. Ensure `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set correctly

## Maintenance

### Updating the Bot
1. Make changes to the code
2. Rebuild the Docker image
3. Follow deployment steps 2-4

### Checking Status
```bash
# Check if container is running
gcloud compute ssh INSTANCE_NAME --zone ZONE_NAME --command "docker ps"

# View logs
gcloud compute ssh INSTANCE_NAME --zone ZONE_NAME --command "docker logs discord-bot"
```

### Restarting the Bot
```bash
gcloud compute ssh INSTANCE_NAME --zone ZONE_NAME --command "docker restart discord-bot"
```

## Security Notes

1. Never commit sensitive files to version control:
   - `config.json` with bot token
   - `service-account-key.json`
2. Use environment variables for sensitive data when possible
3. Regularly rotate service account keys and bot tokens
4. Keep the VM instance and Docker images updated with security patches

## Environment Variables

Replace the following placeholders with your actual values:
- `INSTANCE_NAME`: Your Google Cloud VM instance name
- `ZONE_NAME`: Your Google Cloud zone (e.g., us-central1-c)
- `discord-bot`: Your preferred container name 