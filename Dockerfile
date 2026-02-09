# Multi-stage build for React + Vite application

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb* ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build arguments for environment variables (required at build time for Vite)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set environment variables for build (with fallback to empty if not provided)
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Verify environment variables are set (warn if not)
RUN if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then \
    echo "WARNING: Supabase environment variables may not be set. Build may fail."; \
    fi

# Build the application
RUN npm run build || (echo "Build failed. Check the error above." && exit 1)

# Verify build output exists
RUN ls -la /app/dist || (echo "Build failed - dist directory not found" && exit 1)
RUN test -f /app/dist/index.html || (echo "Build failed - index.html not found" && exit 1)

# Stage 2: Production server with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verify nginx config is valid
RUN nginx -t

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
