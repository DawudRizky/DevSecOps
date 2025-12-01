# Fix: project.tujuh CORS 405 Error

## 🔍 Problem Analysis

**Error:** OPTIONS request to `http://project.tujuh/api/auth/v1/signup` returns **405 Not Allowed**

**Root Cause:** 
`project.tujuh` domain is **NOT configured** in Nginx Proxy Manager, causing:
1. Requests fall back to NPM default host
2. Default host serves static HTML (no proxy)
3. No CORS headers configured
4. OPTIONS method not handled → **405 Not Allowed**

**Current Configuration:**
- ✅ `unsecure-project.tujuh` → proxies to `vulnapp-webapp` container (port 3000)
- ✅ `secure-project.tujuh` → proxies to `vulnapp-webapp-secure` container (port 3001)
- ❌ `project.tujuh` → **NOT CONFIGURED** (falls back to default NPM page)

---

## 🚀 Solution: Add project.tujuh to Nginx Proxy Manager

### Option 1: Via NPM Admin UI (Recommended)

1. **Access NPM Admin:**
   ```bash
   # Open in browser
   http://localhost:81
   
   # Login credentials:
   # Email: admin@example.com
   # Password: changeme (or your changed password)
   ```

2. **Add New Proxy Host:**
   - Click **"Proxy Hosts"** in the menu
   - Click **"Add Proxy Host"** button
   
3. **Configure Details Tab:**
   - **Domain Names:** `project.tujuh`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `vulnapp-webapp` (container name)
   - **Forward Port:** `80`
   - ✅ Enable **"Cache Assets"**
   - ✅ Enable **"Block Common Exploits"**
   - ✅ Enable **"Websockets Support"**

4. **Configure Custom Locations (Important for /api/):**
   - Click **"Custom Locations"** tab
   - Click **"Add Location"**
   - **Define Location:** `/api/`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `host.docker.internal`
   - **Forward Port:** `54321`
   
5. **Add Advanced Configuration:**
   - Go to **"Advanced"** tab
   - Add this configuration:
   
   ```nginx
   # CORS Headers for API requests
   location /api/ {
       proxy_pass http://host.docker.internal:54321/;
       
       # Preserve original headers
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       
       # CORS headers
       add_header Access-Control-Allow-Origin * always;
       add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
       add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey,x-client-info,x-supabase-api-version' always;
       add_header Access-Control-Expose-Headers 'Content-Length,Content-Range' always;
       
       # Handle preflight OPTIONS requests
       if ($request_method = 'OPTIONS') {
           add_header Access-Control-Allow-Origin * always;
           add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
           add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey,x-client-info,x-supabase-api-version' always;
           add_header Access-Control-Max-Age 1728000 always;
           add_header Content-Type 'text/plain; charset=utf-8' always;
           add_header Content-Length 0 always;
           return 204;
       }
   }
   ```

6. **Save Configuration:**
   - Click **"Save"**
   - NPM will reload nginx automatically

---

### Option 2: Via Direct Configuration File (Advanced)

If you prefer command-line configuration:

1. **Create Proxy Host Configuration:**

```bash
# Create configuration file directly in NPM container
docker exec nginx-proxy-manager bash -c 'cat > /data/nginx/proxy_host/4.conf << '\''EOF'\''
# ------------------------------------------------------------
# project.tujuh
# ------------------------------------------------------------

map \$scheme \$hsts_header {
    https   "max-age=63072000; preload";
}

server {
  set \$forward_scheme http;
  set \$server         "vulnapp-webapp";
  set \$port           80;

  listen 80;
  listen [::]:80;

  server_name project.tujuh;
  http2 off;

  # Asset Caching
  include conf.d/include/assets.conf;

  proxy_set_header Upgrade \$http_upgrade;
  proxy_set_header Connection \$http_connection;
  proxy_http_version 1.1;

  access_log /data/logs/proxy-host-4_access.log proxy;
  error_log /data/logs/proxy-host-4_error.log warn;

  # API proxy with CORS support
  location /api/ {
      proxy_pass http://host.docker.internal:54321/;
      
      proxy_set_header Host \$host;
      proxy_set_header X-Real-IP \$remote_addr;
      proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \$scheme;
      
      # CORS headers
      add_header Access-Control-Allow-Origin * always;
      add_header Access-Control-Allow-Methods '\''GET, POST, PUT, DELETE, PATCH, OPTIONS'\'' always;
      add_header Access-Control-Allow-Headers '\''DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey,x-client-info,x-supabase-api-version'\'' always;
      add_header Access-Control-Expose-Headers '\''Content-Length,Content-Range'\'' always;
      
      # Handle preflight OPTIONS requests
      if (\$request_method = '\''OPTIONS'\'') {
          add_header Access-Control-Allow-Origin * always;
          add_header Access-Control-Allow-Methods '\''GET, POST, PUT, DELETE, PATCH, OPTIONS'\'' always;
          add_header Access-Control-Allow-Headers '\''DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey,x-client-info,x-supabase-api-version'\'' always;
          add_header Access-Control-Max-Age 1728000 always;
          add_header Content-Type '\''text/plain; charset=utf-8'\'' always;
          add_header Content-Length 0 always;
          return 204;
      }
  }

  # Main application
  location / {
      proxy_set_header Upgrade \$http_upgrade;
      proxy_set_header Connection \$http_connection;
      proxy_http_version 1.1;
      
      include conf.d/include/proxy.conf;
  }

  # Custom
  include /data/nginx/custom/server_proxy[.]conf;
}
EOF'

# Reload nginx
docker exec nginx-proxy-manager nginx -s reload
```

2. **Verify Configuration:**

```bash
# Test nginx configuration syntax
docker exec nginx-proxy-manager nginx -t

# Check if configuration loaded
docker exec nginx-proxy-manager cat /data/nginx/proxy_host/4.conf
```

---

## ✅ Verification Steps

### 1. Test OPTIONS Request (Preflight)

```bash
# Should return 204 No Content with CORS headers
curl -X OPTIONS -I "http://project.tujuh/api/auth/v1/signup" \
  -H "Origin: http://unsecure-project.tujuh" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: apikey,authorization,content-type"

# Expected Response:
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Headers: ...
```

### 2. Test POST Request (Actual Signup)

```bash
# Should return 200 or appropriate Supabase response
curl -X POST "http://project.tujuh/api/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Origin: http://unsecure-project.tujuh" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

### 3. Test in Browser

```bash
# Open browser console and test
fetch('http://project.tujuh/api/auth/v1/health', {
    headers: {
        'apikey': 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
    }
}).then(r => r.json()).then(console.log)
```

### 4. Check NPM Logs

```bash
# Watch proxy logs
docker logs -f nginx-proxy-manager

# Check specific proxy host logs
docker exec nginx-proxy-manager tail -f /data/logs/proxy-host-4_access.log
docker exec nginx-proxy-manager tail -f /data/logs/proxy-host-4_error.log
```

---

## 🔧 Alternative: Quick Fix Using Existing Domain

If you want a quick fix without configuring NPM, you can **use one of the existing domains**:

### Update Frontend Configuration

Change the Supabase URL from `project.tujuh` to `unsecure-project.tujuh`:

```bash
# Edit .env file
nano /home/dso507/kelompok-tujuh/project-management/.env
```

Change:
```bash
# From:
VITE_SUPABASE_URL=http://project.tujuh/api

# To:
VITE_SUPABASE_URL=http://unsecure-project.tujuh/api
```

Then rebuild:
```bash
cd /home/dso507/kelompok-tujuh
docker-compose up -d --build webapp
```

**Note:** This assumes `vulnapp-webapp` container already has the nginx configuration with `/api/` proxy pass (which it does according to your nginx.conf).

---

## 📊 Summary of Domain Mappings

| Domain | Container | Port | Status | Purpose |
|--------|-----------|------|--------|---------|
| `unsecure-project.tujuh` | `vulnapp-webapp` | 3000→80 | ✅ Configured | Vulnerable app |
| `secure-project.tujuh` | `vulnapp-webapp-secure` | 3001→80 | ✅ Configured | Secure app |
| `project.tujuh` | N/A | - | ❌ **NOT CONFIGURED** | **Needs setup** |
| `wordpress.tujuh` | `vulnerable-wordpress` | 8080→80 | ✅ Configured | Vulnerable WP |

---

## 🐛 Why This Happened

Your frontend is making requests from `http://unsecure-project.tujuh/` (Origin) to `http://project.tujuh/api/auth/v1/signup` (Target).

Because `project.tujuh` is not configured in NPM:
1. NPM default host responds (static HTML page)
2. No CORS headers are sent
3. OPTIONS preflight request gets **405 Not Allowed**
4. Browser blocks the actual POST request

After adding `project.tujuh` to NPM with proper CORS configuration:
1. Requests are proxied to `vulnapp-webapp` container
2. `/api/*` requests are forwarded to Supabase (host.docker.internal:54321)
3. CORS headers are added by nginx
4. OPTIONS requests return **204 No Content** ✅
5. POST requests work properly ✅

---

## 🎯 Recommended Action

**Use Option 1 (NPM Admin UI)** - it's the easiest and most maintainable approach.

After configuration:
1. Clear browser cache
2. Refresh your application
3. Try signup/login again
4. Check browser network tab - should see **204** for OPTIONS, **200** for POST

---

**Created:** November 17, 2025  
**Issue:** CORS 405 Not Allowed on project.tujuh  
**Solution:** Add project.tujuh proxy host in NPM with CORS support
