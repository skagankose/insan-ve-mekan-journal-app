#!/bin/bash

# This script initializes Let's Encrypt certificates for your domain

# Set your domain name
DOMAIN="insanvemekan.com"
DOMAINS=("$DOMAIN" "www.$DOMAIN")

# Set your email for Let's Encrypt
EMAIL="your-email@example.com"  # CHANGE THIS TO YOUR EMAIL

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

echo "Starting Let's Encrypt certificate setup for $DOMAIN..."

# Stop nginx if it's running
systemctl stop nginx 2>/dev/null || true

# Remove existing certificates (if any)
rm -rf /etc/letsencrypt/live/$DOMAIN

# Create directory for challenges
mkdir -p /var/www/certbot

# Get certificate using standalone mode (no nginx running)
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Check if certificate was created successfully
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "SSL certificate successfully created!"
    
    # Set up auto-renewal
    echo "Setting up automatic renewal..."
    
    # Create renewal script
    cat > /etc/cron.d/certbot-renew << EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --post-hook "docker-compose -f /opt/insan_mekan/docker-compose.prod.yml restart nginx"
EOF
    
    echo "Certificate setup complete!"
    echo "You can now start your application with: docker-compose -f docker-compose.prod.yml up -d"
else
    echo "Failed to obtain SSL certificate."
    echo "Please check:"
    echo "1. Domain $DOMAIN points to this server's IP"
    echo "2. Ports 80 and 443 are not blocked by firewall"
    echo "3. Your email address is correct"
    exit 1
fi 