# Production Settings - Localhost References to Update

This document contains all localhost references found in the codebase that need to be updated for Digital Ocean deployment.

## Backend Configuration Files

### `backend/alembic.ini` (Line 63)
```ini
sqlalchemy.url = driver://user:pass@localhost/dbname
```
**Action Required:** Replace `localhost` with your database server IP/domain

### `backend/app/main.py` (Lines 160-161)
```python  
"http://localhost",          # Allow requests from localhost (general)
"http://localhost:5173",     # Allow requests from Vite dev server
```
**Action Required:** Replace with your production domain/IP addresses

## Email Configuration Files

### `backend/app/email_utils.py` (Multiple functions)
- **Line 63:** `base_url: str = "http://localhost:8000"`
- **Line 176:** `base_url: str = "http://localhost:5173"`  
- **Line 293:** `base_url: str = "http://localhost:5173"`
- **Line 387:** `base_url: str = "http://localhost:5173"`
- **Line 481:** `base_url: str = "http://localhost:5173"`
- **Line 578:** `base_url: str = "http://localhost:5173"`

**Action Required:** Update all base_url parameters to use production URLs

### `backend/app/routers/auth.py` (Multiple locations)
- **Line 81:** `base_url_for_email = "http://localhost:8000"`
- **Line 107:** `frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")`
- **Line 308:** `base_url_for_email = "http://localhost:5173"`
- **Line 514:** `base_url_for_email = "http://localhost:8000"`

**Action Required:** Replace hardcoded localhost URLs with production URLs

### `backend/app/notification_utils.py` (Line 8)
```python
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")
```
**Action Required:** Update fallback URL to production frontend URL

## Frontend Configuration Files

### `frontend/vite.config.ts` (Line 11)
```typescript
host: 'localhost'
```
**Action Required:** Replace with production server IP or remove for production build

### `frontend/src/services/apiService.ts` (Line 273)
```typescript
// Use the proxied path. Requests to /api/token will go to http://localhost:8000/token
```
**Action Required:** Update comment to reflect production API endpoint

## Infrastructure Files

### `nginx/nginx.conf` (Line 16)
```nginx
server_name localhost; # Or your domain name
```
**Action Required:** Replace with your actual domain name or server IP

## Documentation Files

### `email_info.md` (Lines 133-135)
```markdown
- Email confirmation: `http://localhost:8000`
- Password reset: `http://localhost:5173`
- General links: `http://localhost:5173`
```
**Action Required:** Update documentation to reflect production URLs

## Code Comments (Less Critical)

### `frontend/src/pages/JournalEntryUpdateDetailsPage.tsx` (Line 422)
```typescript
// Try modern clipboard API first (works on HTTPS and some HTTP localhost)
```
**Action Required:** Update comment to mention HTTPS production environment

---

## Deployment Checklist

### Critical Files to Update:
1. ✅ `backend/app/email_utils.py` - Update all base_url parameters
2. ✅ `backend/app/routers/auth.py` - Update all hardcoded URLs
3. ✅ `backend/app/main.py` - Update CORS origins
4. ✅ `backend/app/notification_utils.py` - Update fallback URL
5. ✅ `frontend/vite.config.ts` - Update host configuration
6. ✅ `nginx/nginx.conf` - Update server_name
7. ✅ `backend/alembic.ini` - Update database URL

### Environment Variables Recommended:
- `BACKEND_URL` - Your backend server URL
- `FRONTEND_URL` - Your frontend server URL  
- `DATABASE_URL` - Your database connection string
- `FRONTEND_BASE_URL` - Base URL for frontend (already used in notification_utils.py)

### URL Replacement Pattern:
- Replace `http://localhost:8000` → `https://your-backend-domain.com` or `http://YOUR_SERVER_IP:8000`
- Replace `http://localhost:5173` → `https://your-frontend-domain.com` or `http://YOUR_SERVER_IP:5173`
- Replace `localhost` → `your-domain.com` or `YOUR_SERVER_IP`

### Security Considerations:
- Use HTTPS in production
- Update CORS settings to only allow your production domains
- Ensure all email links use production URLs
- Test email functionality after deployment

### Testing After Deployment:
- [ ] User registration emails
- [ ] Password reset emails  
- [ ] Email confirmations
- [ ] API endpoints accessibility
- [ ] Frontend-backend communication
- [ ] Database connections 