#!/bin/bash

# Docker Debug Script for Mantra UI
# This script helps diagnose Docker build and runtime issues

echo "=== Docker Debug Script ==="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create a .env file with your Supabase credentials."
    exit 1
else
    echo "✅ .env file found"
fi

# Check if environment variables are set
source .env
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ ERROR: Supabase environment variables not set in .env file!"
    exit 1
else
    echo "✅ Environment variables found"
    echo "   VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ ERROR: Docker is not installed!"
    exit 1
else
    echo "✅ Docker is installed"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ ERROR: Docker Compose is not installed!"
    exit 1
else
    echo "✅ Docker Compose is installed"
fi

echo ""
echo "=== Building Docker Image ==="
docker-compose build --no-cache

echo ""
echo "=== Starting Container ==="
docker-compose up -d

echo ""
echo "=== Checking Container Status ==="
sleep 3
docker-compose ps

echo ""
echo "=== Checking Container Logs ==="
docker-compose logs --tail=50

echo ""
echo "=== Testing Health Endpoint ==="
sleep 2
curl -f http://localhost:8080/health || echo "❌ Health check failed"

echo ""
echo "=== Debug Complete ==="
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
