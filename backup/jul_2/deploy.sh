#!/bin/bash

# Production deployment script for insanvemekan.com
# Run this script on your Digital Ocean server

set -e  # Exit on any error

DOMAIN="insanvemekan.com"
APP_DIR="/root/src/insan_mekan"
EMAIL="admin@insanvemekan.com"  # CHANGE THIS TO YOUR EMAIL

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

# Check if certbot is installed for SSL certificates
if ! command -v certbot &> /dev/null; then
    echo "🔒 Installing Certbot for SSL certificates..."
    apt install snapd -y
    snap install core; snap refresh core
    snap install --classic certbot
    ln -s /snap/bin/certbot /usr/bin/certbot
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
SERVER_IP=$(curl -s https://api.ipify.org)
DOMAIN_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)

echo "Server IP: $SERVER_IP"
echo "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  Warning: Domain $DOMAIN may not point to this server"
    echo "Server IP: $SERVER_IP"
    echo "Domain resolves to: $DOMAIN_IP"
    echo "Make sure your domain points to this server's IP address"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Domain correctly points to this server"
fi

# Smart SSL certificate handling
echo "🔒 Checking SSL certificates..."

# Check if valid certificates already exist
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
NEED_CERT=true

if [ -d "$CERT_PATH" ] && [ -f "$CERT_PATH/fullchain.pem" ] && [ -f "$CERT_PATH/privkey.pem" ]; then
    echo "SSL certificates found. Checking validity..."
    
    # Check if certificate is valid and not expiring soon (within 30 days)
    if openssl x509 -checkend 2592000 -noout -in "$CERT_PATH/cert.pem" >/dev/null 2>&1; then
        echo "✅ SSL certificates are valid and not expiring soon!"
        NEED_CERT=false
    else
        echo "⚠️  SSL certificates are expiring soon or invalid"
    fi
else
    echo "No valid SSL certificates found"
fi

# Get SSL certificate only if needed
if [ "$NEED_CERT" = true ]; then
    echo "🔒 Obtaining SSL certificate..."
    if ./init-letsencrypt.sh; then
        echo "✅ SSL certificate obtained successfully"
    else
        echo "❌ Failed to obtain SSL certificate"
        echo "You may have hit Let's Encrypt rate limits"
        echo "Checking if there are archived certificates we can restore..."
        
        # Try to restore from archive
        if [ -d "/etc/letsencrypt/archive/$DOMAIN" ] && [ -f "/etc/letsencrypt/renewal/$DOMAIN.conf" ]; then
            echo "Found archived certificates. Restoring..."
            mkdir -p "$CERT_PATH"
            cd "$CERT_PATH"
            
            # Find the latest certificate files
            LATEST_NUM=$(ls /etc/letsencrypt/archive/$DOMAIN/cert*.pem | grep -o '[0-9]*' | sort -n | tail -1)
            
            # Create symbolic links
            ln -sf "../../archive/$DOMAIN/cert${LATEST_NUM}.pem" cert.pem
            ln -sf "../../archive/$DOMAIN/chain${LATEST_NUM}.pem" chain.pem
            ln -sf "../../archive/$DOMAIN/fullchain${LATEST_NUM}.pem" fullchain.pem
            ln -sf "../../archive/$DOMAIN/privkey${LATEST_NUM}.pem" privkey.pem
            
            echo "✅ SSL certificates restored from archive"
            cd $APP_DIR
        else
            echo "❌ No archived certificates found"
            echo "You'll need to wait for the rate limit to reset or use staging certificates"
            exit 1
        fi
    fi
else
    echo "✅ Using existing valid SSL certificates"
fi

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
