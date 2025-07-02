#!/bin/bash

# This script initializes Let's Encrypt certificates for your domain

# Set your domain name
DOMAIN="insanvemekan.com"
DOMAINS=("$DOMAIN" "www.$DOMAIN")

# Set your email for Let's Encrypt
EMAIL="admin@insanvemekan.com"  # CHANGE THIS TO YOUR EMAIL

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 
   exit 1
fi

echo "Starting Let's Encrypt certificate setup for $DOMAIN..."

# Stop nginx if it's running
systemctl stop nginx 2>/dev/null || true

# Create directory for challenges
mkdir -p /var/www/certbot

# Find existing certificate (may have suffix like -0001)
CERT_PATH=""
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
elif [ -d "/etc/letsencrypt/live/$DOMAIN-0001" ]; then
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN-0001"
else
    # Look for any certificate matching the domain
    CERT_PATH=$(find /etc/letsencrypt/live -name "$DOMAIN*" -type d | head -1)
fi

# Check if certificate already exists and is valid
if [ -n "$CERT_PATH" ] && [ -f "$CERT_PATH/fullchain.pem" ]; then
    echo "SSL certificate found at: $CERT_PATH"
    echo "Checking if renewal is needed..."
    
    # Check if certificate is valid and not expiring soon (within 30 days)
    if openssl x509 -checkend 2592000 -noout -in "$CERT_PATH/cert.pem" >/dev/null 2>&1; then
        echo "✅ SSL certificate is valid and not expiring soon!"
        exit 0
    else
        echo "⚠️  Certificate is expiring soon or invalid. Will obtain new certificate..."
        # Only remove if certificate is actually invalid/expiring
        rm -rf /etc/letsencrypt/live/$DOMAIN*
        rm -rf /etc/letsencrypt/archive/$DOMAIN*
        rm -rf /etc/letsencrypt/renewal/$DOMAIN*.conf
    fi
fi

# Get certificate using standalone mode (no nginx running)
echo "Obtaining new SSL certificate..."
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Find the newly created certificate
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
else
    CERT_PATH=$(find /etc/letsencrypt/live -name "$DOMAIN*" -type d | head -1)
fi

# Check if certificate exists now
if [ -n "$CERT_PATH" ] && [ -f "$CERT_PATH/fullchain.pem" ]; then
    echo "✅ SSL certificate is ready!"
    
    # Create symbolic link if certificate has suffix (like -0001)
    if [[ "$CERT_PATH" != "/etc/letsencrypt/live/$DOMAIN" ]]; then
        echo "Creating symbolic link for nginx compatibility..."
        ln -sf "$CERT_PATH" "/etc/letsencrypt/live/$DOMAIN"
        echo "✅ Symbolic link created: /etc/letsencrypt/live/$DOMAIN -> $CERT_PATH"
    fi
    
    # Set up auto-renewal
    echo "Setting up automatic renewal..."
    
    # Create renewal script (overwrites existing one)
    cat > /etc/cron.d/certbot-renew << EOF
# Renew Let's Encrypt certificates twice daily
0 */12 * * * root certbot renew --quiet --post-hook "docker-compose -f /root/src/insan_mekan/docker-compose.prod.yml restart nginx"
EOF
    
    echo "Certificate setup complete!"
else
    echo "❌ Failed to obtain SSL certificate."
    echo "Please check:"
    echo "1. Domain $DOMAIN points to this server's IP"
    echo "2. Ports 80 and 443 are not blocked by firewall"
    echo "3. Your email address is correct"
    exit 1
fi 
