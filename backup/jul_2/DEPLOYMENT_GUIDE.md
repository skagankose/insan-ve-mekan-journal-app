# Digital Ocean Deployment Guide for insanvemekan.com

This guide will help you deploy your full-stack application to Digital Ocean with HTTPS support.

## Prerequisites
- ✅ Digital Ocean account
- ✅ Domain `insanvemekan.com` purchased from Namecheap
- ✅ Basic SSH knowledge

## Step 1: Create Digital Ocean Droplet

1. **Create Droplet**:
   - Ubuntu 22.04 LTS
   - Size: $24/month (4GB RAM, 2 CPUs) minimum
   - Add your SSH key
   - Choose datacenter region

2. **Note your droplet's IP address**

## Step 2: Configure Domain DNS (Namecheap)

1. Login to Namecheap
2. Go to Domain List → Manage `insanvemekan.com`
3. Add DNS records:
   ```
   Type: A     | Name: @   | Value: YOUR_DROPLET_IP
   Type: A     | Name: www | Value: YOUR_DROPLET_IP
   ```
4. Wait 5-15 minutes for propagation

## Step 3: Connect to Server

```bash
ssh root@YOUR_DROPLET_IP
```

## Step 4: Clone and Setup Application

```bash
# Clone repository
cd /opt
git clone https://github.com/YOUR_USERNAME/insan_mekan.git
cd insan_mekan

# Create production environment file
nano .env
```

### Configure .env file:
```env
# Database
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=insan_mekan_prod

# Application URLs
BACKEND_URL=https://insanvemekan.com/api
FRONTEND_URL=https://insanvemekan.com
FRONTEND_BASE_URL=https://insanvemekan.com

# JWT Secret (generate a secure random string)
JWT_SECRET_KEY=your_very_secure_jwt_secret_key_here

# Email Settings (if you have SMTP configured)
SMTP_SERVER=your_smtp_server
SMTP_PORT=587
SMTP_USERNAME=your_email@domain.com
SMTP_PASSWORD=your_email_password

# Add other environment variables from your development .env
```

## Step 5: Update Configuration Files

**Update email in deployment scripts:**
```bash
# Edit both files and replace your-email@example.com with your actual email
nano init-letsencrypt.sh  # Line 10
nano deploy.sh           # Line 9
```

## Step 6: Make Scripts Executable

```bash
chmod +x init-letsencrypt.sh
chmod +x deploy.sh
```

## Step 7: Deploy Application

```bash
./deploy.sh
```

This script will:
- Install Docker and Docker Compose
- Configure firewall
- Build and start your application
- Obtain SSL certificates from Let's Encrypt
- Start all services with HTTPS

## Step 8: Verify Deployment

Your application should be available at:
- **Frontend**: https://insanvemekan.com
- **API**: https://insanvemekan.com/api

## Useful Commands

### Check application status:
```bash
cd /opt/insan_mekan
docker compose -f docker-compose.prod.yml ps
```

### View logs:
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Restart services:
```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Stop services:
```bash
docker compose -f docker-compose.prod.yml down
```

### Update application:
```bash
cd /opt/insan_mekan
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### SSL Certificate Issues:
```bash
# Check certificate status
certbot certificates

# Manually renew certificate
certbot renew --force-renewal

# Test certificate renewal
certbot renew --dry-run
```

### Domain Not Resolving:
```bash
# Check DNS propagation
nslookup insanvemekan.com
dig insanvemekan.com

# Check if ports are open
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### Application Not Starting:
```bash
# Check Docker logs
docker compose -f docker-compose.prod.yml logs

# Check individual service logs
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs postgres

# Check container status
docker ps -a
```

### High Memory Usage:
```bash
# Monitor resources
htop
docker stats

# Restart if needed
docker compose -f docker-compose.prod.yml restart
```

## Security Best Practices

1. **Keep system updated**:
   ```bash
   apt update && apt upgrade -y
   ```

2. **Monitor logs regularly**:
   ```bash
   tail -f /var/log/nginx/access.log
   tail -f /var/log/nginx/error.log
   ```

3. **Backup database regularly**:
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql
   ```

4. **Monitor SSL certificate expiration**:
   Certificates auto-renew, but check periodically:
   ```bash
   certbot certificates
   ```

## Support

If you encounter issues:
1. Check the logs as shown above
2. Verify DNS settings in Namecheap
3. Ensure all environment variables are set correctly
4. Check firewall settings: `ufw status`

## Maintenance Schedule

- **Daily**: Check application logs
- **Weekly**: Monitor resource usage
- **Monthly**: Update system packages
- **Quarterly**: Review and update dependencies 