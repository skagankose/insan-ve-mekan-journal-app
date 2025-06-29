#!/bin/bash

# Production deployment script for insanvemekan.com
# Run this script on your Digital Ocean server

set -e  # Exit on any error

DOMAIN="insanvemekan.com"
APP_DIR="/opt/insan_mekan"
EMAIL="your-email@example.com"  # CHANGE THIS TO YOUR EMAIL

echo "🚀 Starting deployment for $DOMAIN..."

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root"
   exit 1
fi

# Update the system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt install docker-compose-plugin -y
fi

# Configure firewall
echo "🔒 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload

# Navigate to app directory
cd $APP_DIR

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your production configuration."
    echo "Use the .env.example as a template if available."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down 2>/dev/null || true

# Build and start containers (without SSL first)
echo "🏗️ Building and starting containers..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d postgres backend frontend

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "❌ Some services failed to start. Check logs:"
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi

# Test domain resolution
echo "🌐 Testing domain resolution..."
if ! nslookup $DOMAIN | grep -q "Address"; then
    echo "⚠️  Warning: Domain $DOMAIN may not be properly configured"
    echo "Make sure your domain points to this server's IP address"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
./init-letsencrypt.sh

# Start nginx with SSL
echo "🚀 Starting nginx with SSL..."
docker compose -f docker-compose.prod.yml up -d nginx

# Final health check
echo "🏥 Performing health check..."
sleep 10

if curl -f -s https://$DOMAIN/api/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "⚠️  Backend health check failed"
fi

if curl -f -s https://$DOMAIN > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "⚠️  Frontend health check failed"
fi

# Show final status
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "Your application should be available at:"
echo "  🌐 https://$DOMAIN"
echo "  🔌 API: https://$DOMAIN/api"
echo ""
echo "To check logs:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To restart services:"
echo "  docker compose -f docker-compose.prod.yml restart"
echo ""
echo "To stop services:"
echo "  docker compose -f docker-compose.prod.yml down" 