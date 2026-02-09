# Docker Setup Guide

This guide explains how to build and run the Mantra UI application using Docker.

## Prerequisites

- Docker installed on your system ([Download Docker](https://www.docker.com/get-started))
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### Using Docker Compose (Recommended)

1. **Create a `.env` file** in the project root (if not already present):
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Build and run** the application:
   ```bash
   docker-compose up --build
   ```

4. **Access the application** at `http://localhost:8080`

### Using Docker directly

1. **Build the Docker image**:
   ```bash
   docker build \
     --build-arg VITE_SUPABASE_URL=your_supabase_url \
     --build-arg VITE_SUPABASE_ANON_KEY=your_supabase_key \
     -t mantra-ui:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d -p 8080:80 --name mantra-ui mantra-ui:latest
   ```

3. **Access the application** at `http://localhost:8080`

## Docker Commands

### View running containers
```bash
docker ps
```

### View logs
```bash
docker-compose logs -f
# or for direct docker
docker logs -f mantra-ui
```

### Stop the application
```bash
docker-compose down
# or for direct docker
docker stop mantra-ui
docker rm mantra-ui
```

### Rebuild after code changes
```bash
docker-compose up --build
```

## Environment Variables

The application requires the following environment variables to be set during build:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

**Important**: These variables are embedded at build time (Vite requirement), so you need to rebuild the Docker image if you change them.

## Production Deployment

For production deployment:

1. **Use environment-specific `.env` files**:
   ```bash
   docker-compose -f docker-compose.yml --env-file .env.production up --build
   ```

2. **Set up reverse proxy** (Nginx/Traefik) in front of the container for SSL/TLS

3. **Use Docker secrets** or environment variable management tools for sensitive data

4. **Consider using multi-stage builds** for smaller image sizes (already implemented)

## Troubleshooting

### Port already in use
Change the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Change 8080 to your preferred port
```

### Build fails with missing environment variables
Ensure your `.env` file exists and contains all required variables, or pass them as build arguments:
```bash
docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... -t mantra-ui .
```

### Application doesn't load
Check the container logs:
```bash
docker logs mantra-ui
```

### Health check fails
The container includes a health check endpoint at `/health`. Verify it's accessible:
```bash
curl http://localhost:8080/health
```

### 503 Service Unavailable Error

If you're getting a 503 error, follow these steps:

1. **Check container logs**:
   ```bash
   docker-compose logs
   # or
   docker logs <container-name>
   ```

2. **Verify the build succeeded**:
   ```bash
   docker-compose build --no-cache
   ```
   Look for any build errors, especially related to missing environment variables.

3. **Check if dist folder was created**:
   ```bash
   docker-compose run --rm app ls -la /usr/share/nginx/html
   ```

4. **Verify nginx configuration**:
   ```bash
   docker-compose run --rm app nginx -t
   ```

5. **Check if environment variables are being passed**:
   ```bash
   # Verify .env file exists and has correct values
   cat .env
   
   # Rebuild with explicit environment variables
   docker-compose build --build-arg VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2) --build-arg VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)
   ```

6. **Use the debug script**:
   ```bash
   ./docker-debug.sh
   ```

7. **Common fixes**:
   - Ensure `.env` file exists in the project root
   - Rebuild without cache: `docker-compose build --no-cache`
   - Restart containers: `docker-compose down && docker-compose up --build`
   - Check if port 8080 is already in use: `lsof -i :8080`
